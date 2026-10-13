import { prisma } from "@/lib/prisma";
import { handle, ok, requireUser } from "@/lib/api";
import { requireMember } from "@/lib/services/chat";
import { emitConv } from "@/lib/realtime";

export const POST = handle(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  await requireMember(params.id, user.id);
  const at = new Date();
  await prisma.conversationMember.update({ where: { conversationId_userId: { conversationId: params.id, userId: user.id } }, data: { lastReadAt: at } });
  await prisma.message.updateMany({ where: { conversationId: params.id, senderId: { not: user.id }, readAt: null }, data: { readAt: at } });
  emitConv({ type: "read", conversationId: params.id, userId: user.id, at: at.toISOString() });
  return ok();
});
