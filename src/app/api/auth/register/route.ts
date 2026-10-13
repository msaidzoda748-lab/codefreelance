import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { ApiError, handle, limit, ok, readJson, str } from "@/lib/api";
import { clientIp } from "@/lib/ratelimit";
import { LANGS } from "@/config/site";
import { validateRegister } from "@/lib/validation";

export const POST = handle(async (req: Request) => {
  limit("register", clientIp(req));
  const b = await readJson(req);
  const input = { name: str(b.name, 120), email: str(b.email, 200).toLowerCase(), password: String(b.password || ""), city: str(b.city, 80), role: str(b.role), uiLanguage: str(b.uiLanguage) };
  const errors = validateRegister(input);
  if (Object.keys(errors).length) throw new ApiError("invalid", 400, { fields: errors });
  if (await prisma.user.findUnique({ where: { email: input.email } })) throw new ApiError("email_taken", 400, { fields: { email: "email_taken" } });
  const lang = (LANGS as readonly string[]).includes(input.uiLanguage) ? input.uiLanguage : "tj";
  const user = await prisma.user.create({
    data: {
      name: input.name, email: input.email, passwordHash: await hashPassword(input.password), role: input.role, city: input.city || "Душанбе", uiLanguage: lang,
      ...(input.role === "FREELANCER"
        ? { profile: { create: { title: "", bio: "", skills: "", hourlyRate: 0, portfolio: "" } } }
        : { clientProfile: { create: {} } }),
    },
  });
  await createSession(user.id);
  return ok({ role: user.role, uiLanguage: lang });
});
