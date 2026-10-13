import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, readJson, requireUser } from "@/lib/api";

/** Switch the active role; creates the missing profile so one account can be both client and freelancer. */
export const POST = handle(async (req: Request) => {
  const u = await requireUser();
  const role = String((await readJson(req)).role || "");
  if (role !== "CLIENT" && role !== "FREELANCER") throw new ApiError("invalid");
  if (role === "FREELANCER" && !u.profile) await prisma.freelancerProfile.create({ data: { userId: u.id, title: "", bio: "", skills: "", hourlyRate: 0, portfolio: "" } });
  if (role === "CLIENT" && !u.clientProfile) await prisma.clientProfile.create({ data: { userId: u.id } });
  await prisma.user.update({ where: { id: u.id }, data: { role } });
  return ok({ role });
});
