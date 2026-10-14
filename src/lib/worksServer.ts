import { prisma } from "./prisma";
import { parseWork } from "./works";

/** Validate payload and resolve category (id or slug) → Prisma data. */
export async function workData(b: Record<string, unknown>) {
  const { categoryKey, ...w } = parseWork(b);
  const cat = categoryKey ? await prisma.category.findFirst({ where: { OR: [{ id: categoryKey }, { slug: categoryKey }] }, select: { id: true } }) : null;
  return { ...w, categoryId: cat?.id ?? null };
}
