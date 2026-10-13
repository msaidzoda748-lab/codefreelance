import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Briefcase } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDict, getLang } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import ChatBox from "@/components/ChatBox";
import Avatar from "@/components/Avatar";
import ConvList, { loadConversations } from "../ConvList";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().chat.title }; }
export default async function ConversationPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/messages/${params.id}`);
  const t = getDict(); const lang = getLang();
  const conv = await prisma.conversation.findUnique({ where: { id: params.id }, include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } }, project: { select: { id: true, title: true } } } });
  // Participants only: everyone else gets a 404 (no existence leak).
  if (!conv || !conv.members.some((m) => m.userId === user.id)) notFound();
  const other = conv.members.find((m) => m.userId !== user.id)?.user ?? null;
  const items = await loadConversations(user.id);
  return (
    <div className="animate-slide-up">
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="card hidden overflow-hidden !p-0 lg:block"><ConvList items={items} active={conv.id} t={t} lang={lang} /></div>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/messages" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100 lg:hidden" aria-label={t.common.back}><ArrowLeft className="h-5 w-5" /></Link>
            {other && <Link href={`/freelancers/${other.id}`} className="flex items-center gap-2 no-underline"><Avatar name={other.name} src={other.avatarUrl} size="sm" /><span className="font-bold text-ink">{other.name}</span></Link>}
            {conv.project && <span className="truncate text-sm text-ink-muted">· <Link href={`/projects/${conv.project.id}`}>{fmt(t.chat.about, { title: conv.project.title })}</Link></span>}
            {conv.orderId && <Link href={`/orders/${conv.orderId}`} className="btn-secondary ml-auto !min-h-[40px] no-underline"><Briefcase className="h-4 w-4" aria-hidden />{t.chat.openOrder}</Link>}
          </div>
          <ChatBox conversationId={conv.id} me={{ id: user.id, name: user.name, avatarUrl: user.avatarUrl }} other={other} />
        </div>
      </div>
    </div>
  );
}
