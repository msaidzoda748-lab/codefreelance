import { prisma } from "@/lib/prisma";
import { handle, limit, ok, readJson, requireUser, str } from "@/lib/api";
import { MSG_PAGE, msgInclude, requireMember, sendMessage, serializeMessage } from "@/lib/services/chat";

type Ctx = { params: { id: string } };
/** Paginated history (newest page first; pass ?before=<messageId> for older). */
export const dynamic = "force-dynamic";
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const conv = await requireMember(params.id, user.id);
  const before = new URL(req.url).searchParams.get("before");
  const cursor = before ? await prisma.message.findFirst({ where: { id: before, conversationId: conv.id } }) : null;
  const rows = await prisma.message.findMany({ where: { conversationId: conv.id, ...(cursor ? { createdAt: { lt: cursor.createdAt } } : {}) }, orderBy: { createdAt: "desc" }, take: MSG_PAGE + 1, include: msgInclude });
  const hasMore = rows.length > MSG_PAGE;
  const others = conv.members.filter((m) => m.userId !== user.id);
  return ok({ messages: rows.slice(0, MSG_PAGE).reverse().map(serializeMessage), hasMore, othersReadAt: others.map((m) => m.lastReadAt).filter(Boolean).sort().at(-1) ?? null });
});
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  limit("message", user.id);
  const b = await readJson(req);
  const r = await sendMessage(user.id, user.name, params.id, str(b.body, 5000), b.clientMessageId ? str(b.clientMessageId, 64) : null, Array.isArray(b.attachmentIds) ? b.attachmentIds.map(String).slice(0, 5) : []);
  return ok(r, r.duplicate ? 200 : 201);
});
