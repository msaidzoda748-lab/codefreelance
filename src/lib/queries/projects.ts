import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export const PAGE_SIZE = 10;
export type ProjectSearch = { q?: string; category?: string; skill?: string; budgetMin?: string; budgetMax?: string; deadlineBefore?: string; language?: string; sort?: string; page?: string; status?: string };

/** Public project search: title+description text search, filters, sorting, pagination. Hidden & draft projects never appear. */
export async function searchProjects(p: ProjectSearch) {
  const q = (p.q || "").trim();
  const page = Math.max(1, parseInt(p.page || "1") || 1);
  const min = parseInt(p.budgetMin || ""); const max = parseInt(p.budgetMax || "");
  const status = p.status === "ALL" ? { in: ["OPEN", "IN_PROGRESS", "COMPLETED"] } : p.status && ["OPEN", "IN_PROGRESS", "COMPLETED"].includes(p.status) ? p.status : "OPEN";
  const where: Prisma.ProjectWhereInput = {
    hidden: false,
    status,
    AND: [
      q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }] } : {},
      p.category ? { categoryRel: { slug: p.category } } : {},
      p.skill ? { skillsRel: { some: { name: { equals: p.skill, mode: "insensitive" as const } } } } : {},
      // budget filter matches fixed budget or overlapping range
      !isNaN(min) ? { OR: [{ budgetMax: { gte: min } }, { budgetMax: null, budget: { gte: min } }] } : {},
      !isNaN(max) ? { OR: [{ budgetMin: { lte: max } }, { budgetMin: null, budget: { lte: max } }] } : {},
      p.deadlineBefore && !isNaN(Date.parse(p.deadlineBefore)) ? { deadline: { lte: new Date(p.deadlineBefore + "T23:59:59") } } : {},
      p.language && ["tj", "ru", "en"].includes(p.language) ? { language: p.language } : {},
    ],
  };
  const orderBy: Prisma.ProjectOrderByWithRelationInput[] =
    p.sort === "budget_desc" ? [{ budget: "desc" }, { createdAt: "desc" }] :
    p.sort === "budget_asc" ? [{ budget: "asc" }, { createdAt: "desc" }] :
    [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
  const [total, items] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { categoryRel: true, _count: { select: { proposals: { where: { status: { not: "WITHDRAWN" } } } } } } }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function activeCategories() {
  return prisma.category.findMany({ where: { active: true }, orderBy: [{ sort: "asc" }, { nameTj: "asc" }] });
}
export function catName(c: { nameTj: string; nameRu: string; nameEn: string } | null | undefined, lang: string, fallback = "") {
  if (!c) return fallback;
  return lang === "ru" ? c.nameRu : lang === "en" ? c.nameEn : c.nameTj;
}
/** Replace project↔skill links from a comma-separated list (creates missing Skill rows). */
export async function setProjectSkills(projectId: string, skills: string) {
  const names = [...new Set(skills.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 15);
  for (const name of names) await prisma.skill.upsert({ where: { name }, create: { name }, update: {} });
  await prisma.project.update({ where: { id: projectId }, data: { skills: names.join(","), skillsRel: { set: names.map((name) => ({ name })) } } });
}
export async function setFreelancerSkills(profileId: string, skills: string) {
  const names = [...new Set(skills.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 20);
  for (const name of names) await prisma.skill.upsert({ where: { name }, create: { name }, update: {} });
  await prisma.freelancerProfile.update({ where: { id: profileId }, data: { skills: names.join(","), skillsRel: { set: names.map((name) => ({ name })) } } });
}
