import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, requireUser } from "@/lib/api";

export const GET = handle(async () => {
  const user = await requireUser();
  if (!user.profile) throw new ApiError("only_freelancer", 403);
  const items = await prisma.portfolioItem.findMany({ where: { profileId: user.profile.id }, orderBy: { createdAt: "desc" } });
  const p = user.profile;
  return ok({ profile: { name: user.name, city: user.city, avatarUrl: user.avatarUrl, title: p.title, bio: p.bio, skills: p.skills, languages: p.languages, rateMin: p.rateMin, rateMax: p.rateMax, experienceYears: p.experienceYears, available: p.available, coverUrl: p.coverUrl }, portfolio: items });
});
