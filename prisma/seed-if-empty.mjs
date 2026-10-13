import { PrismaClient } from "@prisma/client";
import { spawnSync } from "child_process";
const prisma = new PrismaClient();
const count = await prisma.user.count();
const nonDemo = await prisma.user.count({ where: { NOT: { email: { endsWith: "@demo.tj" } } } });
const withCover = await prisma.project.count({ where: { coverUrl: { not: null } } });
await prisma.$disconnect();
// Seed when empty, or refresh when DB only contains old demo data (no covers yet) and no real users.
const shouldSeed = count === 0 || (nonDemo === 0 && withCover === 0);
if (!shouldSeed) {
  console.log(`[seed-if-empty] ${count} users (${nonDemo} real), skipping seed`);
} else {
  console.log("[seed-if-empty] seeding demo data");
  const r = spawnSync("node", ["prisma/seed.mjs"], { stdio: "inherit" });
  process.exit(r.status ?? 1);
}
