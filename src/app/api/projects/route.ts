import { prisma } from "@/lib/prisma";
import { handle, ok, readJson, requireUser } from "@/lib/api";
import { parseProjectInput } from "@/lib/projectInput";
import { searchProjects, setProjectSkills } from "@/lib/queries/projects";

const COVERS: Record<string, string> = { web: "website", mobile: "mobile", dev: "dashboard", bots: "dashboard", design: "logo", marketing: "translate", translate: "translate" };

export const GET = handle(async (req: Request) => {
  const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
  const r = await searchProjects(sp);
  return ok({ ...r, items: r.items.map((p) => ({ id: p.id, title: p.title, description: p.description, category: p.category, categorySlug: p.categoryRel?.slug, skills: p.skills, budget: p.budget, budgetMin: p.budgetMin, budgetMax: p.budgetMax, deadline: p.deadline, language: p.language, city: p.city, coverUrl: p.coverUrl, createdAt: p.createdAt, status: p.status, proposals: p._count.proposals })) });
});

/** Create a project. `publish: false` saves a draft (not visible publicly). */
export const POST = handle(async (req: Request) => {
  const user = await requireUser({ role: "CLIENT" });
  const b = await readJson(req);
  const { data, skills } = await parseProjectInput(b);
  const publish = b.publish !== false;
  const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
  const project = await prisma.project.create({
    data: { ...data, clientId: user.id, skills: "", status: publish ? "OPEN" : "DRAFT", publishedAt: publish ? new Date() : null, city: data.city ?? user.city, coverUrl: `/img/covers/${COVERS[cat?.slug || ""] || "website"}.svg` },
  });
  await setProjectSkills(project.id, skills);
  if (Array.isArray(b.attachmentIds)) {
    await prisma.attachment.updateMany({ where: { id: { in: b.attachmentIds.map(String) }, uploaderId: user.id, projectId: null, messageId: null, proposalId: null, submissionId: null }, data: { projectId: project.id, visibility: "PUBLIC" } });
  }
  return ok({ id: project.id, status: project.status }, 201);
});
