import { prisma } from "@/lib/prisma";
import { ApiError, handle, int, ok, readJson, requireUser, str } from "@/lib/api";
import { setFreelancerSkills } from "@/lib/queries/projects";

/** Update own freelancer profile. */
export const PUT = handle(async (req: Request) => {
  const user = await requireUser();
  if (!user.profile) throw new ApiError("only_freelancer", 403);
  const b = await readJson(req);
  const title = str(b.title, 120);
  const rateMin = b.rateMin === "" || b.rateMin == null ? null : int(b.rateMin);
  const rateMax = b.rateMax === "" || b.rateMax == null ? null : int(b.rateMax);
  const fields: Record<string, string> = {};
  if (title.length < 2) fields.title = "min2";
  if (rateMin != null && (isNaN(rateMin) || rateMin < 0)) fields.rateMin = "positive";
  if (rateMax != null && (isNaN(rateMax) || (rateMin != null && rateMax < rateMin))) fields.rateMax = "range";
  const exp = int(b.experienceYears);
  if (Object.keys(fields).length) throw new ApiError("invalid", 400, { fields });
  await prisma.freelancerProfile.update({ where: { id: user.profile.id }, data: { title, bio: str(b.bio, 4000), languages: str(b.languages, 200), rateMin, rateMax, hourlyRate: rateMin ?? user.profile.hourlyRate, experienceYears: isNaN(exp) ? 0 : Math.max(0, Math.min(60, exp)), available: b.available !== false } });
  if (b.name) await prisma.user.update({ where: { id: user.id }, data: { name: str(b.name, 120), ...(b.city ? { city: str(b.city, 80) } : {}) } });
  await setFreelancerSkills(user.profile.id, str(b.skills, 600));
  return ok();
});
