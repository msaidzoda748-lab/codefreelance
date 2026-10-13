import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { ApiError, handle, ok, readJson, str } from "@/lib/api";
import { validatePassword } from "@/lib/validation";

export const POST = handle(async (req: Request) => {
  const b = await readJson(req);
  const token = str(b.token, 200);
  const password = String(b.password || "");
  const pe = validatePassword(password);
  if (pe) throw new ApiError("invalid", 400, { fields: { password: pe } });
  const rec = await prisma.passwordResetToken.findUnique({ where: { tokenHash: createHash("sha256").update(token).digest("hex") } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) throw new ApiError("token_invalid", 400);
  await prisma.$transaction([
    prisma.user.update({ where: { id: rec.userId }, data: { passwordHash: await hashPassword(password) } }),
    prisma.passwordResetToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: rec.userId } }),
  ]);
  return ok();
});
