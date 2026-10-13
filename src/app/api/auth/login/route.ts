import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { ApiError, handle, limit, ok, readJson, str } from "@/lib/api";
import { clientIp } from "@/lib/ratelimit";

export const POST = handle(async (req: Request) => {
  const body = await readJson(req);
  const email = str(body.email, 200).toLowerCase();
  const password = String(body.password || "");
  limit("login", `${clientIp(req)}:${email}`);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw new ApiError("bad_credentials", 401);
  if (user.status !== "ACTIVE") throw new ApiError("restricted", 403);
  await createSession(user.id);
  return ok({ role: user.role, isAdmin: user.isAdmin, uiLanguage: user.uiLanguage });
});
