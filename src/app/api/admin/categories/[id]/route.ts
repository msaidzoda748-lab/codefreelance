import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, readJson, requireUser, str } from "@/lib/api";

export const PATCH = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireUser({ admin: true });
  const b = await readJson(req);
  const c = await prisma.category.findUnique({ where: { id: params.id } });
  if (!c) throw new ApiError("not_found", 404);
  const data: Record<string, unknown> = {};
  if (typeof b.active === "boolean") data.active = b.active;
  for (const k of ["nameTj", "nameRu", "nameEn"] as const) if (b[k] !== undefined) { const v = str(b[k], 80); if (v.length < 2) throw new ApiError("invalid"); data[k] = v; }
  await prisma.category.update({ where: { id: c.id }, data });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: "category.update", targetType: "CATEGORY", targetId: c.id, reason: str(b.reason, 300) || "update", meta: JSON.stringify(data) } });
  return ok();
});
