import { prisma } from "@/lib/prisma";
import { ApiError, handle, int, limit, ok, readJson, requireUser, str } from "@/lib/api";
import { notifyUser } from "@/lib/notifications";
import { validateProposal } from "@/lib/validation";

/** Send a proposal. One active proposal per freelancer per project; a withdrawn one can be re-sent. */
export const POST = handle(async (req: Request) => {
  const user = await requireUser({ role: "FREELANCER" });
  limit("proposal", user.id);
  const b = await readJson(req);
  const input = { projectId: str(b.projectId, 50), coverLetter: str(b.coverLetter, 5000), price: int(b.price), deliveryDays: int(b.deliveryDays) };
  const errors = validateProposal(input);
  if (Object.keys(errors).length) throw new ApiError("invalid", 400, { fields: errors });
  const project = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!project || project.hidden) throw new ApiError("not_found", 404);
  if (project.clientId === user.id) throw new ApiError("self_action");
  if (project.status !== "OPEN" || (project.proposalDeadline && project.proposalDeadline < new Date(new Date().toDateString()))) throw new ApiError("not_open");
  const existing = await prisma.proposal.findUnique({ where: { projectId_freelancerId: { projectId: project.id, freelancerId: user.id } } });
  if (existing && existing.status !== "WITHDRAWN") throw new ApiError("already_proposed");
  const myItems = Array.isArray(b.portfolioItemIds) && user.profile
    ? (await prisma.portfolioItem.findMany({ where: { id: { in: b.portfolioItemIds.map(String) }, profileId: user.profile.id }, select: { id: true } })).map((x) => ({ id: x.id }))
    : [];
  const data = { coverLetter: input.coverLetter, price: input.price, deliveryDays: input.deliveryDays, status: "SENT", portfolioItems: { set: myItems } };
  const proposal = existing
    ? await prisma.proposal.update({ where: { id: existing.id }, data })
    : await prisma.proposal.create({ data: { ...data, portfolioItems: { connect: myItems }, projectId: project.id, freelancerId: user.id } });
  if (Array.isArray(b.attachmentIds)) {
    await prisma.attachment.updateMany({ where: { id: { in: b.attachmentIds.map(String) }, uploaderId: user.id, projectId: null, messageId: null, proposalId: null, submissionId: null }, data: { proposalId: proposal.id, visibility: "PRIVATE" } });
  }
  await notifyUser({ userId: project.clientId, type: "NEW_PROPOSAL", params: { name: user.name, project: project.title }, link: `/projects/${project.id}` });
  return ok({ id: proposal.id }, 201);
});
