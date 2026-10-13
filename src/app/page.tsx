import { prisma } from "@/lib/prisma";
import { avgRating } from "@/lib/auth";
import HomeClient from "@/components/HomeClient";
import { HOME_PROJECTS_LIMIT } from "@/data/home";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [projects, profiles, projectCount, freelancerCount, reviews] = await Promise.all([
    prisma.project.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: HOME_PROJECTS_LIMIT }),
    prisma.freelancerProfile.findMany({ include: { user: { include: { reviewsRecv: { select: { rating: true } } } } } }),
    prisma.project.count(),
    prisma.freelancerProfile.count(),
    prisma.review.findMany({ select: { rating: true } }),
  ]);
  const freelancers = profiles
    .map((f) => ({ userId: f.userId, name: f.user.name, avatarUrl: f.user.avatarUrl, title: f.title, city: f.user.city, skills: f.skills, rating: avgRating(f.user.reviewsRecv), reviews: f.user.reviewsRecv.length, experienceYears: f.experienceYears }))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviews - a.reviews)
    .slice(0, 4);
  const satisfied = reviews.length ? Math.round((reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100) : 100;
  return (
    <HomeClient
      projects={projects.map((p) => ({ id: p.id, title: p.title, description: p.description, category: p.category, skills: p.skills, budget: p.budget, coverUrl: p.coverUrl, city: p.city, createdAt: p.createdAt.toISOString(), status: p.status }))}
      freelancers={freelancers}
      stats={{ projectCount, freelancerCount, satisfied }}
    />
  );
}
