import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDict, getLang } from "@/i18n/server";
import { activeCategories, catName } from "@/lib/queries/projects";
import { workImages } from "@/lib/works";
import WorkForm from "@/components/works/WorkForm";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().works.editTitle }; }
/** Only the author may edit; everyone else gets a 404 (no existence leak). */
export default async function EditWorkPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/works/${params.id}/edit`);
  const w = await prisma.portfolioItem.findUnique({ where: { id: params.id } });
  if (!w || !user.profile || w.profileId !== user.profile.id) notFound();
  const t = getDict(); const lang = getLang();
  const cats = await activeCategories();
  return (
    <div className="mx-auto max-w-3xl animate-slide-up">
      <p className="eyebrow">{t.nav.works}</p>
      <h1 className="mb-5 mt-1 page-title">{t.works.editTitle}</h1>
      <WorkForm categories={cats.map((c) => ({ id: c.id, label: catName(c, lang) }))}
        initial={{ id: w.id, title: w.title, description: w.description, categoryId: w.categoryId || "", tech: w.tech, images: workImages(w.images), link: w.link || "", appStoreUrl: w.appStoreUrl || "", playUrl: w.playUrl || "", sourceUrl: w.sourceUrl || "", downloadUrl: w.downloadUrl || "" }} />
    </div>
  );
}
