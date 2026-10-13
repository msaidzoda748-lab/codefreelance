import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDict, getLang } from "@/i18n/server";
import { activeCategories, catName } from "@/lib/queries/projects";
import ProjectForm from "@/components/ProjectForm";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().pf.editTitle }; }
const d = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : "");
export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/projects/${params.id}/edit`);
  const p = await prisma.project.findUnique({ where: { id: params.id }, include: { skillsRel: true } });
  if (!p || p.clientId !== user.id) notFound();
  const t = getDict(); const lang = getLang();
  if (!["DRAFT", "OPEN"].includes(p.status)) redirect(`/projects/${p.id}`);
  const cats = await activeCategories();
  return (
    <div className="mx-auto max-w-3xl animate-slide-up">
      <h1 className="mb-5 text-2xl font-extrabold text-ink sm:text-3xl">{t.pf.editTitle}</h1>
      <ProjectForm categories={cats.map((c) => ({ id: c.id, label: catName(c, lang) }))} initial={{ id: p.id, status: p.status, title: p.title, description: p.description, categoryId: p.categoryId || "", skills: p.skillsRel.map((s) => s.name).join(", ") || p.skills, budget: p.budget, budgetMin: p.budgetMin ?? "", budgetMax: p.budgetMax ?? "", deadline: d(p.deadline), proposalDeadline: d(p.proposalDeadline), language: p.language }} />
    </div>
  );
}
