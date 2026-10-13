import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, readJson, requireUser, str } from "@/lib/api";
import { findOrCreateDirect, sendMessage } from "@/lib/services/chat";
import { notifyUser } from "@/lib/notifications";

/** Client invites a freelancer to one of their open projects → conversation message + notification. */
export const POST = handle(async (req: Request) => {
  const user = await requireUser({ role: "CLIENT" });
  const b = await readJson(req);
  const project = await prisma.project.findUnique({ where: { id: str(b.projectId, 50) } });
  if (!project || project.clientId !== user.id) throw new ApiError("not_found", 404);
  if (project.status !== "OPEN") throw new ApiError("not_open");
  const fl = await prisma.user.findUnique({ where: { id: str(b.freelancerId, 50) }, include: { profile: true } });
  if (!fl?.profile) throw new ApiError("not_found", 404);
  const conv = await findOrCreateDirect(user.id, fl.id, project.id);
  await sendMessage(user.id, user.name, conv.id, `${str(b.message, 1000) || "👋"}\n→ /projects/${project.id}`, null, []);
  await notifyUser({ userId: fl.id, type: "INVITED", params: { name: user.name, project: project.title }, link: `/projects/${project.id}` });
  return ok({ conversationId: conv.id });
});
