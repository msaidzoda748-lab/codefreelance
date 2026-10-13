import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
/** Legacy URL: redirect to the order's conversation (participants only). */
export default async function LegacyChat({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/projects/${params.id}/chat`);
  const conv = await prisma.conversation.findFirst({ where: { projectId: params.id, members: { some: { userId: user.id } } }, select: { id: true } });
  if (!conv) notFound();
  redirect(`/messages/${conv.id}`);
}
