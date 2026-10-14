import { prisma } from "@/lib/prisma";
import { ApiError, handle, limit, ok, readJson, requireUser } from "@/lib/api";
import { workData } from "@/lib/worksServer";

/** Create a work (showcase item). Freelancers only. */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (!user.profile) throw new ApiError("only_freelancer", 403);
  limit("work", user.id);
  if ((await prisma.portfolioItem.count({ where: { profileId: user.profile.id } })) >= 50) throw new ApiError("rate_limited", 429);
  const item = await prisma.portfolioItem.create({ data: { ...(await workData(await readJson(req))), profileId: user.profile.id } });
  return ok({ id: item.id }, 201);
});
