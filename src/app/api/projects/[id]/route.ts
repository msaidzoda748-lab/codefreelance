import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, readJson, requireUser } from "@/lib/api";
import { parseProjectInput } from "@/lib/projectInput";
import { setProjectSkills } from "@/lib/queries/projects";

type Ctx = { params: { id: string } };

async function own(id: string, userId: string) {
  const p = await prisma.project.findUnique({ where: { id } });
  if (!p) throw new ApiError("not_found", 404);
  if (p.clientId !== userId) throw new ApiError("forbidden", 403);
  return p;
}

/** Edit fields (only DRAFT/OPEN), or run an action: publish | close. */
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const p = await own(params.id, user.id);
  const b = await readJson(req);
  if (b.action === "publish") {
    if (p.status !== "DRAFT") throw new ApiError("bad_transition", 409);
    await prisma.project.update({ where: { id: p.id }, data: { status: "OPEN", publishedAt: new Date() } });
    return ok({ status: "OPEN" });
  }
  if (b.action === "close") {
    if (!["DRAFT", "OPEN"].includes(p.status)) throw new ApiError("bad_transition", 409);
    await prisma.$transaction([
      prisma.project.update({ where: { id: p.id }, data: { status: "CLOSED", closedAt: new Date() } }),
      prisma.proposal.updateMany({ where: { projectId: p.id, status: "SENT" }, data: { status: "REJECTED" } }),
    ]);
    return ok({ status: "CLOSED" });
  }
  if (!["DRAFT", "OPEN"].includes(p.status)) throw new ApiError("bad_transition", 409);
  const { data, skills } = await parseProjectInput(b);
  await prisma.project.update({ where: { id: p.id }, data });
  await setProjectSkills(p.id, skills);
  if (Array.isArray(b.attachmentIds)) {
    await prisma.attachment.updateMany({ where: { id: { in: b.attachmentIds.map(String) }, uploaderId: user.id, projectId: null, messageId: null, proposalId: null, submissionId: null }, data: { projectId: p.id, visibility: "PUBLIC" } });
  }
  return ok({ status: p.status });
});
