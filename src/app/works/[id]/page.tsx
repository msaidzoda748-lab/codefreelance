import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, ChevronLeft, Eye, EyeOff, Pencil, Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDict, getLang } from "@/i18n/server";
import { fdate, fmt } from "@/i18n/format";
import { catName } from "@/lib/queries/projects";
import { PUBLIC_WORK } from "@/lib/queries/works";
import { workImages } from "@/lib/works";
import Avatar from "@/components/Avatar";
import ProfileActions from "@/components/ProfileActions";
import ReportButton from "@/components/ReportButton";
import ActionButton from "@/components/ui/ActionButton";
import WorkGallery from "@/components/works/WorkGallery";
import WorkLinks from "@/components/works/WorkLinks";
import WorkCard from "@/components/works/WorkCard";

export const dynamic = "force-dynamic";

async function load(id: string) {
  return prisma.portfolioItem.findUnique({ where: { id }, include: { category: true, profile: { include: { user: { select: { id: true, name: true, avatarUrl: true, status: true, city: true } } } } } });
}
export async function generateMetadata({ params }: { params: { id: string } }) {
  const w = await prisma.portfolioItem.findUnique({ where: { id: params.id }, select: { title: true, description: true, hidden: true } });
  return w && !w.hidden ? { title: w.title, description: w.description.slice(0, 160) } : {};
}

export default async function WorkPage({ params }: { params: { id: string } }) {
  const t = getDict(); const lang = getLang();
  const [me, w] = await Promise.all([getCurrentUser(), load(params.id)]);
  if (!w) notFound();
  const author = w.profile.user;
  const isOwner = !!me && me.id === author.id;
  if ((w.hidden || author.status !== "ACTIVE") && !isOwner && !me?.isAdmin) notFound();
  if (!isOwner) await prisma.portfolioItem.update({ where: { id: w.id }, data: { views: { increment: 1 } }, select: { id: true } });
  const views = w.views + (isOwner ? 0 : 1);
  const tech = w.tech.split(",").map((s) => s.trim()).filter(Boolean);
  const [more, openProjects] = await Promise.all([
    prisma.portfolioItem.findMany({ where: { ...PUBLIC_WORK, profileId: w.profileId, id: { not: w.id } }, orderBy: { createdAt: "desc" }, take: 3, include: { category: true } }),
    me && !isOwner && me.role === "CLIENT" ? prisma.project.findMany({ where: { clientId: me.id, status: "OPEN", hidden: false }, select: { id: true, title: true }, take: 20 }) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-slide-up">
      <Link href="/works" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold no-underline"><ChevronLeft className="h-4 w-4" aria-hidden />{t.nav.works}</Link>
      {w.hidden && <p role="status" className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"><EyeOff className="h-4 w-4" aria-hidden />{t.works.hiddenNote}</p>}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <WorkGallery images={workImages(w.images)} title={w.title} label={t.works.gallery} />
          <div>
            {w.category && <p className="eyebrow">{catName(w.category, lang)}</p>}
            <h1 className="page-title mt-1" data-testid="work-title">{w.title}</h1>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" aria-hidden />{fdate(w.createdAt, lang)}</span>
              <span className="inline-flex items-center gap-1" data-testid="work-views"><Eye className="h-4 w-4" aria-hidden />{fmt(t.works.views, { n: views })}</span>
            </div>
          </div>
          <div className="card space-y-4">
            <WorkLinks w={w} t={t} />
            {w.description && <p className="whitespace-pre-line leading-relaxed text-ink-muted" data-testid="work-desc">{w.description}</p>}
            {tech.length > 0 && <ul className="flex flex-wrap gap-2" aria-label={t.works.tech}>{tech.map((s) => <li key={s}><Link href={`/works?tech=${encodeURIComponent(s)}`} className="chip no-underline"><Tag className="h-3 w-3" aria-hidden />{s}</Link></li>)}</ul>}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="card" aria-labelledby="author-h" data-testid="work-author">
            <h2 id="author-h" className="eyebrow">{t.works.author}</h2>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={author.name} src={author.avatarUrl} size="lg" />
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-bold text-ink"><span className="truncate">{author.name}</span><BadgeCheck className="h-4 w-4 shrink-0 text-brand-600" aria-hidden /></p>
                <p className="truncate text-sm text-brand-700">{w.profile.title}</p>
                <p className="text-xs text-ink-muted">{author.city}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <ProfileActions userId={author.id} openProjects={openProjects} canInvite />
              <Link href={`/freelancers/${author.id}`} className="btn-secondary no-underline">{t.works.viewProfile}</Link>
            </div>
          </section>
          {isOwner && (
            <section className="card flex flex-wrap gap-2" data-testid="work-owner">
              <Link href={`/works/${w.id}/edit`} className="btn-secondary no-underline" data-testid="work-edit"><Pencil className="h-4 w-4" aria-hidden />{t.common.edit}</Link>
              <ActionButton url={`/api/portfolio/${w.id}`} method="DELETE" label={t.common.delete} className="btn-ghost !text-rose-600" confirm={t.works.deleteConfirm} redirectTo={{ key: "ok", prefix: "/works?deleted=" }} testId="work-delete" />
            </section>
          )}
          {!isOwner && <div className="flex justify-end"><ReportButton targetType="WORK" targetId={w.id} /></div>}
        </aside>
      </div>

      {more.length > 0 && (
        <section aria-labelledby="more-h" className="space-y-4">
          <h2 id="more-h" className="text-xl font-bold text-ink">{t.works.more}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{more.map((m) => <WorkCard key={m.id} t={t} w={{ ...m, category: m.category ? catName(m.category, lang) : undefined }} />)}</div>
        </section>
      )}
    </div>
  );
}
