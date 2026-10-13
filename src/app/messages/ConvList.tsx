import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { unreadCounts } from "@/lib/services/chat";
import type { Dict } from "@/i18n";
import { relTime } from "@/i18n/format";
import Avatar from "@/components/Avatar";

export async function loadConversations(userId: string) {
  const [convs, unread] = await Promise.all([
    prisma.conversation.findMany({
      where: { members: { some: { userId } } }, orderBy: { lastMessageAt: "desc" }, take: 100,
      include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } }, project: { select: { title: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, hidden: true } } },
    }),
    unreadCounts(userId),
  ]);
  return convs.map((c) => ({ id: c.id, orderId: c.orderId, project: c.project?.title, at: c.lastMessageAt, other: c.members.find((m) => m.userId !== userId)?.user, last: c.messages[0], unread: unread[c.id] || 0 }));
}
export default function ConvList({ items, active, t, lang }: { items: Awaited<ReturnType<typeof loadConversations>>; active?: string; t: Dict; lang: string }) {
  if (!items.length) return <p className="p-6 text-center text-sm text-ink-muted">{t.chat.empty}</p>;
  return (
    <ul className="divide-y divide-line" data-testid="conv-list">
      {items.map((c) => (
        <li key={c.id}>
          <Link href={`/messages/${c.id}`} aria-current={active === c.id ? "page" : undefined} className={`flex items-center gap-3 p-3 no-underline transition hover:bg-slate-50 ${active === c.id ? "bg-brand-50" : ""}`}>
            <Avatar name={c.other?.name || "?"} src={c.other?.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><span className="truncate font-semibold text-ink">{c.other?.name}</span><span className="shrink-0 text-[11px] text-ink-muted">{relTime(c.at, lang)}</span></div>
              {c.project && <p className="truncate text-xs text-brand-700">{c.project}</p>}
              <p className="truncate text-xs text-ink-muted">{c.last ? (c.last.hidden ? t.chat.hidden : c.last.body || "📎") : t.chat.noMessages}</p>
            </div>
            {c.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white" aria-label={`${c.unread}`}>{c.unread}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
