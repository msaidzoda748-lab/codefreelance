import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDict, getLang } from "@/i18n/server";
import { activeCategories, catName } from "@/lib/queries/projects";
import ProjectForm from "@/components/ProjectForm";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().pf.newTitle }; }
export default async function NewProjectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/projects/new");
  const t = getDict(); const lang = getLang();
  const cats = await activeCategories();
  return (
    <div className="mx-auto max-w-3xl animate-slide-up">
      <h1 className="mb-5 page-title">{t.pf.newTitle}</h1>
      {user.role !== "CLIENT" && <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{t.errors.only_client}</p>}
      <ProjectForm categories={cats.map((c) => ({ id: c.id, label: catName(c, lang) }))} />
    </div>
  );
}
