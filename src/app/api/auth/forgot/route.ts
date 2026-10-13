import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/auth";
import { handle, limit, ok, readJson, str } from "@/lib/api";
import { clientIp } from "@/lib/ratelimit";
import { mailProvider, sendMail } from "@/lib/mail";

export const POST = handle(async (req: Request) => {
  const b = await readJson(req);
  const email = str(b.email, 200).toLowerCase();
  limit("forgot", `${clientIp(req)}:${email}`);
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.status === "ACTIVE") {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 60 * 60_000) } });
    const link = `${appUrl()}/reset-password?token=${token}`;
    await sendMail(user.email, "Zoir Freelance — password reset", `Барқарор кардани рамз / Сброс пароля / Reset password:\n${link}\n\n(1 hour)`).catch((e) => console.error("[mail] failed", e));
  }
  // Same response whether or not the account exists. `emailConfigured` tells the UI honestly if mail can be delivered at all.
  return ok({ emailConfigured: mailProvider() !== "log" });
});
