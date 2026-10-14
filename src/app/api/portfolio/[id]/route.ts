import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, readJson, requireUser } from "@/lib/api";
import { workData } from "@/lib/worksServer";

type Ctx = { params: { id: string } };
async function mine(id: string, profileId?: string) {
  const it = await prisma.portfolioItem.findUnique({ where: { id } });
  if (!it) throw new ApiError("not_found", 404);
  if (!profileId || it.profileId !== profileId) throw new ApiError("forbidden", 403);
  return it;
}
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  await mine(params.id, user.profile?.id);
  await prisma.portfolioItem.update({ where: { id: params.id }, data: await workData(await readJson(req)) });
  return ok();
});
export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  await mine(params.id, user.profile?.id);
  await prisma.portfolioItem.delete({ where: { id: params.id } });
  return ok();
});
