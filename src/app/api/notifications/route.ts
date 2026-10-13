import { prisma } from "@/lib/prisma";
import { handle, ok, readJson, requireUser } from "@/lib/api";
import { maybeRunDeadlineJob } from "@/lib/services/deadlines";

const PAGE = 20;
export const dynamic = "force-dynamic";
export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  void maybeRunDeadlineJob(); // lazy fallback when no external cron is configured (idempotent)
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1") || 1);
  const where = { userId: user.id, ...(sp.get("unread") === "1" ? { read: false } : {}) };
  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);
  return ok({ notifications: items, unread, page, pages: Math.max(1, Math.ceil(total / PAGE)) });
});
/** Mark as read: { ids: [...] } or { all: true }. */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const b = await readJson(req);
  const where = b.all ? { userId: user.id, read: false } : { userId: user.id, id: { in: Array.isArray(b.ids) ? b.ids.map(String) : [] } };
  const r = await prisma.notification.updateMany({ where, data: { read: true } });
  return ok({ marked: r.count });
});
