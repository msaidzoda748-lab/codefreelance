import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, limit, ok, readJson, requireUser, str } from "@/lib/api";

const TYPES = ["REVIEW", "PROJECT", "USER", "MESSAGE"];
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  limit("report", user.id);
  const b = await readJson(req);
  const targetType = str(b.targetType).toUpperCase();
  const targetId = str(b.targetId, 50);
  const reason = str(b.reason, 100);
  if (!TYPES.includes(targetType) || !targetId || !reason) throw new ApiError("invalid");
  const exists = targetType === "REVIEW" ? await prisma.review.findUnique({ where: { id: targetId } }) : targetType === "PROJECT" ? await prisma.project.findUnique({ where: { id: targetId } }) : targetType === "USER" ? await prisma.user.findUnique({ where: { id: targetId } }) : await prisma.message.findUnique({ where: { id: targetId } });
  if (!exists) throw new ApiError("not_found", 404);
  try {
    await prisma.report.create({ data: { reporterId: user.id, targetType, targetId, reason, details: str(b.details, 1000) } });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
  }
  return ok({}, 201);
});
