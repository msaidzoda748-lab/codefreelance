import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDict, getLang } from "@/i18n/server";
import { fdatetime, notifText } from "@/i18n/format";
import ActionButton from "@/components/ui/ActionButton";
import Pagination from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/States";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().notif.title }; }
const SIZE = 20;
export default async function NotificationsPage({ searchParams }: { searchParams: { page?: string; unread?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notifications");
  const t = getDict(); const lang = getLang();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const where = { userId: user.id, ...(searchParams.unread ? { read: false } : {}) };
  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * SIZE, take: SIZE }),
    prisma.notification.count({ where }), prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);
  return (
    <div className="mx-auto max-w-3xl animate-slide-up">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t.notif.title}</h1>
        <div className="flex gap-2">
          <Link href={searchParams.unread ? "/notifications" : "/notifications?unread=1"} className="btn-ghost no-underline" aria-pressed={!!searchParams.unread}>{searchParams.unread ? t.common.all : t.notif.unreadOnly}</Link>
          {unread > 0 && <ActionButton url="/api/notifications" body={{ all: true }} label={t.notif.markAll} />}
        </div>
      </div>
      {items.length ? (
        <ul className="card divide-y divide-line !p-0">
          {items.map((n) => (
            <li key={n.id} className={`flex items-start gap-3 p-4 ${n.read ? "" : "bg-brand-50/50"}`}>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-brand-500"}`} aria-hidden />
              <div className="min-w-0 flex-1">
                {n.link ? <Link href={n.link} className="break-words text-sm text-ink no-underline hover:text-brand-700">{notifText(t, n)}</Link> : <p className="break-words text-sm">{notifText(t, n)}</p>}
                <p className="mt-1 text-xs text-ink-muted">{fdatetime(n.createdAt, lang)}</p>
              </div>
              {!n.read && <ActionButton url="/api/notifications" body={{ ids: [n.id] }} label={t.notif.markRead} className="btn-ghost !min-h-[36px] !px-2 text-xs" />}
            </li>
          ))}
        </ul>
      ) : <EmptyState icon={Bell} title={t.notif.empty} />}
      <Pagination page={page} pages={Math.ceil(total / SIZE)} params={searchParams as Record<string, string>} basePath="/notifications" />
    </div>
  );
}
