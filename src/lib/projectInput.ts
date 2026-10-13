import { prisma } from "./prisma";
import { ApiError, int, str } from "./api";
import { validateProject } from "./validation";

/** Parse + validate project payload from JSON body. Accepts categoryId, category slug, or legacy category name. */
export async function parseProjectInput(b: Record<string, unknown>) {
  const rangeMode = b.budgetMode === "range";
  const input = {
    title: str(b.title, 160), description: str(b.description, 8000),
    categoryKey: str(b.categoryId || b.category, 120),
    skills: str(b.skills, 500),
    budget: rangeMode ? int(b.budgetMax) : int(b.budget),
    budgetMin: rangeMode ? int(b.budgetMin) : null, budgetMax: rangeMode ? int(b.budgetMax) : null,
    deadline: str(b.deadline, 30), proposalDeadline: str(b.proposalDeadline, 30) || null,
    language: ["tj", "ru", "en"].includes(str(b.language)) ? str(b.language) : "tj",
    city: str(b.city, 80),
  };
  const cat = input.categoryKey ? await prisma.category.findFirst({ where: { OR: [{ id: input.categoryKey }, { slug: input.categoryKey }, { nameTj: input.categoryKey }] } }) : null;
  const errors = validateProject({ ...input, category: cat ? cat.id : "" });
  if (Object.keys(errors).length) throw new ApiError("invalid", 400, { fields: errors });
  return {
    data: {
      title: input.title, description: input.description, category: cat!.nameTj, categoryId: cat!.id,
      budget: input.budget, budgetMin: input.budgetMin, budgetMax: input.budgetMax,
      deadline: new Date(input.deadline), proposalDeadline: input.proposalDeadline ? new Date(input.proposalDeadline) : null,
      language: input.language, ...(input.city ? { city: input.city } : {}),
    },
    skills: input.skills,
  };
}
