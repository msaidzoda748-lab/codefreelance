import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, readJson, requireUser, str } from "@/lib/api";
import { findOrCreateDirect, unreadCounts } from "@/lib/services/chat";

export const GET = handle(async () => {
  const user = await requireUser();
  const convs = await prisma.conversation.findMany({
    where: { members: { some: { userId: user.id } } }, orderBy: { lastMessageAt: "desc" }, take: 100,
    include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } }, project: { select: { id: true, title: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true, senderId: true, hidden: true } } },
  });
  const unread = await unreadCounts(user.id);
  return ok({ conversations: convs.map((c) => ({ id: c.id, orderId: c.orderId, project: c.project, lastMessageAt: c.lastMessageAt, other: c.members.find((m) => m.userId !== user.id)?.user ?? null, last: c.messages[0] ?? null, unread: unread[c.id] || 0 })) });
});

/** Start (or reuse) a direct conversation with another user, e.g. "Write" button on a profile. */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const b = await readJson(req);
  const other = await prisma.user.findUnique({ where: { id: str(b.userId, 50) } });
  if (!other || other.status !== "ACTIVE") throw new ApiError("not_found", 404);
  const conv = await findOrCreateDirect(user.id, other.id, b.projectId ? str(b.projectId, 50) : null);
  return ok({ id: conv.id });
});
