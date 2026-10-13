import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { ApiError } from "../api";
import { notifyUser } from "../notifications";
import { deriveOrderStatus, milestoneTransition, orderTransition, canEditMilestones, type MilestoneAction, type MilestoneStatus, type OrderStatus } from "../domain/workflow";
import { roleInOrder } from "../domain/authz";

const DAY = 86400000;

/**
 * Accept a proposal → create Order (+ default milestone + conversation) atomically.
 * Double-hire protection: conditional project update (status must still be OPEN) inside a transaction
 * plus the unique index on Order.projectId.
 */
export async function hireProposal(clientId: string, projectId: string, proposalId: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (!project || project.clientId !== clientId) throw new ApiError("not_found", 404);
      const proposal = await tx.proposal.findUnique({ where: { id: proposalId } });
      if (!proposal || proposal.projectId !== projectId) throw new ApiError("not_found", 404);
      if (proposal.status !== "SENT") throw new ApiError("bad_transition", 409);
      if (proposal.freelancerId === clientId) throw new ApiError("self_action", 400);
      const claimed = await tx.project.updateMany({ where: { id: projectId, status: "OPEN" }, data: { status: "IN_PROGRESS", acceptedProposalId: proposalId } });
      if (claimed.count !== 1) throw new ApiError("already_hired", 409);
      await tx.proposal.update({ where: { id: proposalId }, data: { status: "ACCEPTED" } });
      const rejected = await tx.proposal.findMany({ where: { projectId, status: "SENT", id: { not: proposalId } }, select: { id: true, freelancerId: true } });
      await tx.proposal.updateMany({ where: { id: { in: rejected.map((r) => r.id) } }, data: { status: "REJECTED" } });
      const deadline = new Date(Math.max(Date.now() + proposal.deliveryDays * DAY, Date.now() + DAY));
      const order = await tx.order.create({
        data: {
          projectId, proposalId, clientId, freelancerId: proposal.freelancerId, price: proposal.price, status: "NEGOTIATION", deadline,
          milestones: { create: { title: "Иҷрои лоиҳа", description: project.title, deadline, amount: proposal.price, status: "PENDING" } },
          conversation: { create: { projectId, members: { create: [{ userId: clientId }, { userId: proposal.freelancerId }] } } },
        },
      });
      return { order, project, proposal, rejected };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    const { order, project, proposal, rejected } = result;
    await notifyUser({ userId: proposal.freelancerId, type: "PROPOSAL_ACCEPTED", params: { project: project.title }, link: `/orders/${order.id}` });
    for (const r of rejected) await notifyUser({ userId: r.freelancerId, type: "PROPOSAL_REJECTED", params: { project: project.title }, link: `/projects/${projectId}` });
    return order;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2002" || e.code === "P2034")) throw new ApiError("already_hired", 409);
    throw e;
  }
}

async function loadOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { milestones: true, project: true } });
  if (!order) throw new ApiError("not_found", 404);
  return order;
}

async function syncOrder(orderId: string, actorId: string) {
  const order = await loadOrder(orderId);
  const next = deriveOrderStatus(order.status as OrderStatus, order.milestones.map((m) => ({ status: m.status as MilestoneStatus })));
  if (next === order.status) return order;
  await prisma.order.update({ where: { id: orderId }, data: { status: next, ...(next === "COMPLETED" ? { completedAt: new Date() } : {}) } });
  if (next === "COMPLETED") {
    await prisma.project.update({ where: { id: order.projectId }, data: { status: "COMPLETED" } });
    for (const uid of [order.clientId, order.freelancerId]) await notifyUser({ userId: uid, type: "ORDER_COMPLETED", params: { project: order.project.title }, link: `/orders/${orderId}` });
  }
  void actorId;
  return { ...order, status: next };
}

export async function orderAction(userId: string, orderId: string, action: "start" | "cancel", reason = "") {
  const order = await loadOrder(orderId);
  const role = roleInOrder({ id: userId }, order);
  if (!role) throw new ApiError("not_participant", 403);
  const tr = orderTransition(action, role, order.status as OrderStatus);
  if (!tr.ok) throw new ApiError(tr.code, tr.code === "forbidden" ? 403 : 409);
  const upd = await prisma.order.updateMany({ where: { id: orderId, status: order.status }, data: { status: tr.to, ...(tr.to === "CANCELLED" ? { cancelledAt: new Date() } : {}) } });
  if (upd.count !== 1) throw new ApiError("bad_transition", 409);
  if (action === "start") {
    const first = order.milestones.filter((m) => m.status === "PENDING").sort((a, b) => a.position - b.position)[0];
    if (first) await prisma.milestone.update({ where: { id: first.id }, data: { status: "IN_PROGRESS", events: { create: { actorId: userId, action: "start", fromStatus: "PENDING", toStatus: "IN_PROGRESS" } } } });
    await notifyUser({ userId: order.clientId, type: "ORDER_STARTED", params: { project: order.project.title }, link: `/orders/${orderId}` });
  } else {
    await prisma.project.update({ where: { id: order.projectId }, data: { status: "CLOSED", closedAt: new Date() } });
    await prisma.milestone.updateMany({ where: { orderId, status: { in: ["PENDING", "IN_PROGRESS", "REVISION_REQUESTED", "SUBMITTED"] } }, data: { status: "CANCELLED" } });
    await notifyUser({ userId: order.freelancerId, type: "ORDER_CANCELLED", params: { project: order.project.title, reason }, link: `/orders/${orderId}` });
  }
  return { status: tr.to };
}

export async function milestoneAction(userId: string, milestoneId: string, action: MilestoneAction, input: { comment?: string; message?: string; attachmentIds?: string[] } = {}) {
  const ms = await prisma.milestone.findUnique({ where: { id: milestoneId }, include: { order: { include: { project: true } } } });
  if (!ms) throw new ApiError("not_found", 404);
  const role = roleInOrder({ id: userId }, ms.order);
  if (!role) throw new ApiError("not_participant", 403);
  const comment = (input.comment ?? input.message ?? "").trim();
  if (action === "submit" && comment.length < 5 && !(input.attachmentIds?.length)) throw new ApiError("invalid", 400, { fields: { message: "min5" } });
  const tr = milestoneTransition(action, role, ms.status as MilestoneStatus, ms.order.status as OrderStatus, action === "requestRevision" ? comment : "ok-comment");
  if (!tr.ok) throw new ApiError(tr.code, tr.code === "forbidden" ? 403 : tr.code === "invalid" ? 400 : 409, tr.code === "invalid" ? { fields: { comment: "min5" } } : {});
  // optimistic concurrency: only move from the status we validated
  const upd = await prisma.milestone.updateMany({ where: { id: ms.id, status: ms.status }, data: { status: tr.to } });
  if (upd.count !== 1) throw new ApiError("bad_transition", 409);
  await prisma.milestoneEvent.create({ data: { milestoneId: ms.id, actorId: userId, action, fromStatus: ms.status, toStatus: tr.to, comment } });
  if (action === "submit") {
    const sub = await prisma.submission.create({ data: { milestoneId: ms.id, authorId: userId, message: comment } });
    if (input.attachmentIds?.length) {
      await prisma.attachment.updateMany({ where: { id: { in: input.attachmentIds }, uploaderId: userId, submissionId: null, messageId: null, proposalId: null, projectId: null }, data: { submissionId: sub.id, visibility: "PRIVATE" } });
    }
    await notifyUser({ userId: ms.order.clientId, type: "WORK_SUBMITTED", params: { milestone: ms.title, project: ms.order.project.title }, link: `/orders/${ms.orderId}` });
  }
  if (action === "requestRevision") await notifyUser({ userId: ms.order.freelancerId, type: "REVISION_REQUESTED", params: { milestone: ms.title, comment }, link: `/orders/${ms.orderId}` });
  if (action === "accept") await notifyUser({ userId: ms.order.freelancerId, type: "MILESTONE_ACCEPTED", params: { milestone: ms.title }, link: `/orders/${ms.orderId}` });
  const order = await syncOrder(ms.orderId, userId);
  return { status: tr.to, orderStatus: order.status };
}

export async function upsertMilestone(userId: string, orderId: string, data: { id?: string; title: string; description: string; deadline: Date; amount?: number | null }) {
  const order = await loadOrder(orderId);
  const role = roleInOrder({ id: userId }, order);
  if (!role) throw new ApiError("not_participant", 403);
  if (!canEditMilestones(role, order.status as OrderStatus)) throw new ApiError(role === "CLIENT" ? "bad_transition" : "only_client", 403);
  if (data.title.trim().length < 3 || isNaN(data.deadline.getTime())) throw new ApiError("invalid", 400);
  if (data.id) {
    const ms = order.milestones.find((m) => m.id === data.id);
    if (!ms) throw new ApiError("not_found", 404);
    if (!["PENDING", "IN_PROGRESS"].includes(ms.status)) throw new ApiError("bad_transition", 409);
    const changes = [ms.title !== data.title && `title: ${ms.title} → ${data.title}`, ms.deadline.getTime() !== data.deadline.getTime() && `deadline: ${ms.deadline.toISOString().slice(0, 10)} → ${data.deadline.toISOString().slice(0, 10)}`].filter(Boolean).join("; ");
    await prisma.milestone.update({ where: { id: ms.id }, data: { title: data.title, description: data.description, deadline: data.deadline, amount: data.amount ?? null, deadlineNotifiedAt: ms.deadline.getTime() !== data.deadline.getTime() ? null : ms.deadlineNotifiedAt, events: { create: { actorId: userId, action: "edit", comment: changes } } } });
    return ms.id;
  }
  const position = order.milestones.length;
  const status = order.status === "NEGOTIATION" ? "PENDING" : "IN_PROGRESS";
  const created = await prisma.milestone.create({ data: { orderId, title: data.title, description: data.description, deadline: data.deadline, amount: data.amount ?? null, position, status, events: { create: { actorId: userId, action: "create", toStatus: status } } } });
  await syncOrder(orderId, userId);
  return created.id;
}
