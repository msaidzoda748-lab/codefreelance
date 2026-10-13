import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDict } from "@/i18n/server";
import { timeAgoT } from "@/lib/timeago";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Паёмҳо" };

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/messages");
  const t = getDict();
  const accepted = await prisma.proposal.findMany({ where: { freelancerId: user.id, status: "ACCEPTED" }, select: { projectId: true } });
  const projects = await prisma.project.findMany({
    where: { acceptedProposalId: { not: null }, OR: [{ clientId: user.id }, { id: { in: accepted.map((a) => a.projectId) } }] },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { name: true } } } }, _count: { select: { messages: { where: { readAt: null, NOT: { senderId: user.id } } } } } },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="mx-auto max-w-3xl animate-slide-up">
      <h1 className="mb-5 text-2xl font-extrabold tracking-tight text-ink dark:text-white">{t.messages.title}</h1>
      {projects.length === 0 ? (
        <div className="card py-12 text-center"><MessageCircle className="mx-auto h-10 w-10 text-slate-300" aria-hidden /><p className="mt-3 text-sm text-ink-muted">{t.messages.empty}</p></div>
      ) : (
        <ul className="grid gap-3">
          {projects.map((p) => {
            const last = p.messages[0];
            return (
              <li key={p.id}>
                <Link href={`/projects/${p.id}/chat`} className="flex min-h-[64px] items-center gap-4 rounded-[20px] border border-line bg-white p-4 no-underline text-inherit shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-900">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><MessageCircle className="h-5 w-5" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="truncate font-bold text-ink dark:text-white">{p.title}</span><StatusBadge status={p.status} /></div>
                    <p className="truncate text-sm text-ink-muted">{last ? `${last.sender.name}: ${last.body || "📎"}` : t.messages.open}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-ink-muted">
                    {last && <span>{timeAgoT(last.createdAt, t)}</span>}
                    {p._count.messages > 0 && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">{p._count.messages}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
