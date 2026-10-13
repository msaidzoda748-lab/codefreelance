import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, readJson, requireUser } from "@/lib/api";
import { parsePortfolio } from "@/lib/portfolio";

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (!user.profile) throw new ApiError("only_freelancer", 403);
  const item = await prisma.portfolioItem.create({ data: { ...parsePortfolio(await readJson(req)), profileId: user.profile.id } });
  return ok({ id: item.id }, 201);
});
