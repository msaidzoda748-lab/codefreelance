// Grants admin to emails listed in ADMIN_EMAILS (comma separated). Never creates accounts.
import { PrismaClient } from "@prisma/client";
const emails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
if (!emails.length) { console.log("[promote-admins] ADMIN_EMAILS not set"); process.exit(0); }
const prisma = new PrismaClient();
for (const email of emails) {
  const r = await prisma.user.updateMany({ where: { email: { equals: email, mode: "insensitive" } }, data: { isAdmin: true } });
  console.log(`[promote-admins] ${email.replace(/^(.).*@/, "$1***@")}: ${r.count ? "admin" : "not registered yet"}`);
}
await prisma.$disconnect();
