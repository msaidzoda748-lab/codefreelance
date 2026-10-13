import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onConv, sseResponse } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const member = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: params.id, userId: user.id } } });
  if (!member) return new Response("Forbidden", { status: 403 });
  return sseResponse((send) => onConv(params.id, send));
}
