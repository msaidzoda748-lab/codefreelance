import { prisma } from "@/lib/prisma";
import { handle, ok, readJson, requireUser, str } from "@/lib/api";

export const GET = handle(async () => {
  const user = await requireUser();
  const rows = await prisma.savedProject.findMany({ where: { userId: user.id }, select: { projectId: true } });
  return ok({ ids: rows.map((r) => r.projectId) });
});
/** Toggle a saved project: { projectId, saved: boolean } */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const b = await readJson(req);
  const projectId = str(b.projectId, 50);
  if (b.saved === false) await prisma.savedProject.deleteMany({ where: { userId: user.id, projectId } });
  else if (await prisma.project.findUnique({ where: { id: projectId } })) await prisma.savedProject.upsert({ where: { userId_projectId: { userId: user.id, projectId } }, create: { userId: user.id, projectId }, update: {} });
  return ok();
});
