import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, int, ok, readJson, requireUser, str } from "@/lib/api";
import { canReview } from "@/lib/domain/authz";
import { notifyUser } from "@/lib/notifications";

/** Leave a review for a completed order (participants only, once each, never self). */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const b = await readJson(req);
  const rating = int(b.rating);
  const comment = str(b.comment, 2000);
  if (!(rating >= 1 && rating <= 5)) throw new ApiError("invalid", 400, { fields: { rating: "rating" } });
  if (comment.length < 5) throw new ApiError("invalid", 400, { fields: { comment: "min5" } });
  const order = await prisma.order.findUnique({ where: { id: str(b.orderId, 50) }, include: { reviews: true, project: true } });
  if (!order) throw new ApiError("not_found", 404);
  const check = canReview(user, order, order.reviews);
  if (!check.ok) throw new ApiError(check.code, check.code === "not_participant" ? 403 : 400);
  try {
    await prisma.review.create({ data: { orderId: order.id, projectId: order.projectId, fromUserId: user.id, toUserId: check.toUserId, rating, comment } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new ApiError("already_reviewed");
    throw e;
  }
  await notifyUser({ userId: check.toUserId, type: "NEW_REVIEW", params: { name: user.name, rating }, link: `/orders/${order.id}` });
  return ok({}, 201);
});
