import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDict, getLang } from "@/i18n/server";
import { activeCategories, catName } from "@/lib/queries/projects";
import WorkForm from "@/components/works/WorkForm";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().works.newTitle }; }
export default async function NewWorkPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/works/new");
  const t = getDict(); const lang = getLang();
  const cats = await activeCategories();
  return (
    <div className="mx-auto max-w-3xl animate-slide-up">
      <p className="eyebrow">{t.nav.works}</p>
      <h1 className="mb-5 mt-1 page-title">{t.works.newTitle}</h1>
      {!user.profile ? <p role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{t.works.onlyFreelancer}</p>
        : <WorkForm categories={cats.map((c) => ({ id: c.id, label: catName(c, lang) }))} />}
    </div>
  );
}
