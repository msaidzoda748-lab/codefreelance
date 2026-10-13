import { prisma } from "@/lib/prisma";
import { ApiError, handle, int, ok, readJson, requireUser, str } from "@/lib/api";

export const POST = handle(async (req: Request) => {
  const admin = await requireUser({ admin: true });
  const b = await readJson(req);
  const slug = str(b.slug, 40).toLowerCase().replace(/[^a-z0-9-]/g, "");
  const nameTj = str(b.nameTj, 80), nameRu = str(b.nameRu, 80) || nameTj, nameEn = str(b.nameEn, 80) || nameTj;
  if (!slug || nameTj.length < 2) throw new ApiError("invalid", 400, { fields: { ...(slug ? {} : { slug: "required" }), ...(nameTj.length < 2 ? { nameTj: "min2" } : {}) } });
  if (await prisma.category.findUnique({ where: { slug } })) throw new ApiError("invalid", 400, { fields: { slug: "email_taken" } });
  const c = await prisma.category.create({ data: { slug, nameTj, nameRu, nameEn, sort: isNaN(int(b.sort)) ? 20 : int(b.sort) } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: "category.create", targetType: "CATEGORY", targetId: c.id, reason: str(b.reason, 300) || "create" } });
  return ok({ id: c.id }, 201);
});
