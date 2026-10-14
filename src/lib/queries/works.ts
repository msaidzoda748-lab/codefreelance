import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export const WORK_SORTS = ["new", "popular", "old"] as const;
export type WorkSort = (typeof WORK_SORTS)[number];
export const PUBLIC_WORK: Prisma.PortfolioItemWhereInput = { hidden: false, profile: { user: { status: "ACTIVE" } } };

export async function searchWorks(o: { q?: string; category?: string; tech?: string; sort?: string; page?: number; size?: number }) {
  const size = o.size ?? 12;
  const page = Math.max(1, o.page || 1);
  const q = (o.q || "").trim().slice(0, 100);
  const tech = (o.tech || "").trim().slice(0, 40);
  const where: Prisma.PortfolioItemWhereInput = {
    ...PUBLIC_WORK,
    ...(o.category ? { category: { slug: o.category } } : {}),
    ...(tech ? { tech: { contains: tech, mode: "insensitive" } } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { tech: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const sort: WorkSort = (WORK_SORTS as readonly string[]).includes(o.sort || "") ? (o.sort as WorkSort) : "new";
  const orderBy: Prisma.PortfolioItemOrderByWithRelationInput[] = sort === "popular" ? [{ views: "desc" }, { createdAt: "desc" }] : [{ createdAt: sort === "old" ? "asc" : "desc" }];
  const [items, total] = await Promise.all([
    prisma.portfolioItem.findMany({ where, orderBy, skip: (page - 1) * size, take: size, include: { category: true, profile: { select: { user: { select: { id: true, name: true, avatarUrl: true } } } } } }),
    prisma.portfolioItem.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / size)), sort };
}

/** Most used technologies across public works (for the filter). */
export async function topTech(limit = 16) {
  const rows = await prisma.portfolioItem.findMany({ where: PUBLIC_WORK, select: { tech: true }, take: 500 });
  const m = new Map<string, number>();
  for (const r of rows) for (const s of r.tech.split(",").map((x) => x.trim()).filter(Boolean)) m.set(s, (m.get(s) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([s]) => s);
}
