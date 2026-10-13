import { prisma } from "@/lib/prisma";
import { ApiError, handle, int, ok, readJson, requireUser, str } from "@/lib/api";
import { validateProposal } from "@/lib/validation";

type Ctx = { params: { id: string } };
async function mine(id: string, userId: string) {
  const p = await prisma.proposal.findUnique({ where: { id }, include: { project: true } });
  if (!p) throw new ApiError("not_found", 404);
  if (p.freelancerId !== userId) throw new ApiError("forbidden", 403);
  return p;
}
/** Edit a not-yet-accepted proposal, or withdraw it ({action:"withdraw"}). */
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const p = await mine(params.id, user.id);
  const b = await readJson(req);
  if (p.status !== "SENT" || p.project.status !== "OPEN") throw new ApiError("bad_transition", 409);
  if (b.action === "withdraw") {
    await prisma.proposal.update({ where: { id: p.id }, data: { status: "WITHDRAWN" } });
    return ok({ status: "WITHDRAWN" });
  }
  const input = { coverLetter: str(b.coverLetter, 5000), price: int(b.price), deliveryDays: int(b.deliveryDays) };
  const errors = validateProposal(input);
  if (Object.keys(errors).length) throw new ApiError("invalid", 400, { fields: errors });
  await prisma.proposal.update({ where: { id: p.id }, data: input });
  return ok({ status: p.status });
});
