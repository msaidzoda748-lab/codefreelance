import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { ApiError } from "../api";
import { emitConv } from "../realtime";
import { notifyUser } from "../notifications";

export const MSG_PAGE = 30;
export const msgInclude = { sender: { select: { id: true, name: true, avatarUrl: true } }, attachments: { select: { id: true, name: true, mimeType: true, size: true, visibility: true, url: true } } } as const;

/** Throws unless the user is a member. Returns conversation with members. */
export async function requireMember(conversationId: string, userId: string) {
  const c = await prisma.conversation.findUnique({ where: { id: conversationId }, include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } }, project: { select: { id: true, title: true } }, order: { select: { id: true, status: true } } } });
  if (!c) throw new ApiError("not_found", 404);
  if (!c.members.some((m) => m.userId === userId)) throw new ApiError("forbidden", 403);
  return c;
}

export function publicAttachment(a: { id: string; name: string; mimeType: string; size: number; visibility: string; url: string }) {
  return { id: a.id, name: a.name, mimeType: a.mimeType, size: a.size, url: a.visibility === "PRIVATE" ? `/api/files/${a.id}` : a.url };
}
export function serializeMessage(m: Prisma.MessageGetPayload<{ include: typeof msgInclude }>) {
  return { id: m.id, body: m.hidden ? "" : m.body, hidden: m.hidden, createdAt: m.createdAt, senderId: m.senderId, clientMessageId: m.clientMessageId, sender: m.sender, attachments: m.hidden ? [] : m.attachments.map(publicAttachment) };
}

/** Idempotent send: same (sender, clientMessageId) returns the already stored message. */
export async function sendMessage(userId: string, userName: string, conversationId: string, body: string, clientMessageId: string | null, attachmentIds: string[]) {
  const conv = await requireMember(conversationId, userId);
  if (clientMessageId) {
    const dup = await prisma.message.findUnique({ where: { senderId_clientMessageId: { senderId: userId, clientMessageId } }, include: msgInclude });
    if (dup) return { message: serializeMessage(dup), duplicate: true };
  }
  if (!body && !attachmentIds.length) throw new ApiError("invalid", 400, { fields: { body: "required" } });
  let msg;
  try {
    msg = await prisma.message.create({ data: { conversationId, projectId: conv.projectId, senderId: userId, body, clientMessageId }, include: msgInclude });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && clientMessageId) {
      const dup = await prisma.message.findUnique({ where: { senderId_clientMessageId: { senderId: userId, clientMessageId } }, include: msgInclude });
      if (dup) return { message: serializeMessage(dup), duplicate: true };
    }
    throw e;
  }
  if (attachmentIds.length) {
    await prisma.attachment.updateMany({ where: { id: { in: attachmentIds }, uploaderId: userId, messageId: null, proposalId: null, submissionId: null, projectId: null }, data: { messageId: msg.id, visibility: "PRIVATE" } });
    msg = await prisma.message.findUniqueOrThrow({ where: { id: msg.id }, include: msgInclude });
  }
  await prisma.$transaction([
    prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: msg.createdAt } }),
    prisma.conversationMember.update({ where: { conversationId_userId: { conversationId, userId } }, data: { lastReadAt: msg.createdAt } }),
  ]);
  const out = serializeMessage(msg);
  emitConv({ type: "message", conversationId, message: out });
  for (const m of conv.members) if (m.userId !== userId) {
    await notifyUser({ userId: m.userId, type: "NEW_MESSAGE", params: { name: userName, text: (body || attachmentIds.length + " 📎").slice(0, 80) }, link: `/messages/${conversationId}` });
  }
  return { message: out, duplicate: false };
}

/** Find or create a 1:1 conversation (optionally about a project). */
export async function findOrCreateDirect(a: string, b: string, projectId: string | null) {
  if (a === b) throw new ApiError("self_action");
  const existing = await prisma.conversation.findFirst({ where: { orderId: null, projectId, AND: [{ members: { some: { userId: a } } }, { members: { some: { userId: b } } }] } });
  if (existing) return existing;
  return prisma.conversation.create({ data: { projectId, members: { create: [{ userId: a }, { userId: b }] } } });
}

/** Unread count per conversation for a user. */
export async function unreadCounts(userId: string) {
  const members = await prisma.conversationMember.findMany({ where: { userId }, select: { conversationId: true, lastReadAt: true } });
  const res: Record<string, number> = {};
  await Promise.all(members.map(async (m) => {
    res[m.conversationId] = await prisma.message.count({ where: { conversationId: m.conversationId, senderId: { not: userId }, ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}) } });
  }));
  return res;
}
