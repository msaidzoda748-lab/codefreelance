import { PrismaClient } from "@prisma/client";
import { spawnSync } from "child_process";
const prisma = new PrismaClient();
const count = await prisma.user.count();
await prisma.$disconnect();
if (count > 0) {
  console.log(`[seed-if-empty] ${count} users exist, skipping seed`);
} else {
  console.log("[seed-if-empty] empty DB, seeding demo data");
  const r = spawnSync("node", ["prisma/seed.mjs"], { stdio: "inherit" });
  process.exit(r.status ?? 1);
}
