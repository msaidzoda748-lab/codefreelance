import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { ApiError, handle, ok, readJson, requireUser, str } from "@/lib/api";
import { LANGS } from "@/config/site";
import { validatePassword } from "@/lib/validation";

export const GET = handle(async () => {
  const u = await requireUser();
  return ok({ user: { id: u.id, name: u.name, email: u.email, city: u.city, uiLanguage: u.uiLanguage, avatarUrl: u.avatarUrl, role: u.role, isAdmin: u.isAdmin, hasFreelancer: !!u.profile, hasClient: !!u.clientProfile, company: u.clientProfile?.company ?? "", about: u.clientProfile?.about ?? "" } });
});

export const PATCH = handle(async (req: Request) => {
  const u = await requireUser();
  const b = await readJson(req);
  const data: Record<string, string> = {};
  if (b.name !== undefined) { const n = str(b.name, 120); if (n.length < 2) throw new ApiError("invalid", 400, { fields: { name: "min2" } }); data.name = n; }
  if (b.city !== undefined) data.city = str(b.city, 80);
  if (b.uiLanguage !== undefined) { const l = str(b.uiLanguage); if (!(LANGS as readonly string[]).includes(l)) throw new ApiError("invalid"); data.uiLanguage = l; }
  if (b.newPassword !== undefined) {
    if (!(await verifyPassword(String(b.currentPassword || ""), u.passwordHash))) throw new ApiError("invalid", 400, { fields: { currentPassword: "wrong" } });
    const pe = validatePassword(String(b.newPassword)); if (pe) throw new ApiError("invalid", 400, { fields: { newPassword: pe } });
    data.passwordHash = await hashPassword(String(b.newPassword));
  }
  await prisma.user.update({ where: { id: u.id }, data });
  if (u.clientProfile && (b.company !== undefined || b.about !== undefined)) {
    await prisma.clientProfile.update({ where: { userId: u.id }, data: { company: str(b.company, 120), about: str(b.about, 2000) } });
  }
  return ok();
});
