import { prisma } from "../prisma";
import { notifyUser } from "../notifications";

const WINDOW_H = Number(process.env.DEADLINE_WINDOW_HOURS || 48);

/**
 * Idempotent: notifies both order participants once per milestone deadline (dedupeKey includes the deadline,
 * so moving a deadline produces exactly one new reminder). Safe to call from cron as often as you like.
 */
export async function runDeadlineJob(now = new Date()) {
  const until = new Date(now.getTime() + WINDOW_H * 3600_000);
  const due = await prisma.milestone.findMany({
    where: { status: { in: ["PENDING", "IN_PROGRESS", "REVISION_REQUESTED"] }, deadline: { lte: until }, deadlineNotifiedAt: null, order: { status: { in: ["NEGOTIATION", "IN_PROGRESS", "IN_REVIEW", "REVISION_REQUESTED"] } } },
    include: { order: { include: { project: { select: { title: true } } } } },
    take: 500,
  });
  let sent = 0;
  for (const m of due) {
    const overdue = m.deadline < now;
    for (const uid of [m.order.clientId, m.order.freelancerId]) {
      const n = await notifyUser({ userId: uid, type: "DEADLINE_SOON", params: { milestone: m.title, project: m.order.project.title, date: m.deadline.toISOString().slice(0, 10), overdue: overdue ? 1 : 0 }, link: `/orders/${m.orderId}`, dedupeKey: `deadline:${m.id}:${uid}:${m.deadline.toISOString()}` });
      if (n) sent++;
    }
    await prisma.milestone.update({ where: { id: m.id }, data: { deadlineNotifiedAt: now } });
  }
  globalThis.__cfDeadlineLast = Date.now();
  return { checked: due.length, notificationsSent: sent };
}
declare global { // eslint-disable-next-line no-var
  var __cfDeadlineLast: number | undefined; }
export async function maybeRunDeadlineJob() {
  if (Date.now() - (globalThis.__cfDeadlineLast || 0) < 30 * 60_000) return;
  globalThis.__cfDeadlineLast = Date.now();
  try { await runDeadlineJob(); } catch (e) { console.error("[deadlines]", e); }
}
