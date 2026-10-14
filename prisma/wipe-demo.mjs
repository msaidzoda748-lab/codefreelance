// Removes seeded demo accounts (isDemo or @demo.tj) and everything they own (via FK cascades).
// Real users are never touched. Idempotent. Skip with KEEP_DEMO=1.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
if (process.env.KEEP_DEMO === "1") { console.log("[wipe-demo] KEEP_DEMO=1, skipping"); process.exit(0); }
const where = { OR: [{ isDemo: true }, { email: { endsWith: "@demo.tj" } }] };
const demo = await prisma.user.findMany({ where, select: { id: true } });
const ids = demo.map((u) => u.id);
if (ids.length) {
  const counts = await Promise.all([prisma.project.count({ where: { clientId: { in: ids } } }), prisma.proposal.count({ where: { freelancerId: { in: ids } } }), prisma.portfolioItem.count({ where: { profile: { userId: { in: ids } } } }), prisma.message.count({ where: { senderId: { in: ids } } }), prisma.order.count({ where: { OR: [{ clientId: { in: ids } }, { freelancerId: { in: ids } }] } })]);
  // Reports/audit entries pointing at demo targets
  await prisma.report.deleteMany({ where: { targetType: "USER", targetId: { in: ids } } });
  const r = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`[wipe-demo] deleted users=${r.count} projects=${counts[0]} proposals=${counts[1]} works=${counts[2]} messages=${counts[3]} orders=${counts[4]}`);
} else console.log("[wipe-demo] no demo users");
// Empty conversations left behind
await prisma.conversation.deleteMany({ where: { members: { none: {} } } }).catch(() => {});
const real = await prisma.user.count(); const admins = await prisma.user.count({ where: { isAdmin: true } });
console.log(`[wipe-demo] remaining real users=${real} admins=${admins}`);
await prisma.$disconnect();
