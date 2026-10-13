import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, CheckCircle2, ExternalLink, Languages, MapPin, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { avgRating, getCurrentUser } from "@/lib/auth";
import { parseSkills } from "@/lib/utils";
import { getDict, getLang } from "@/i18n/server";
import { fdate, fmt } from "@/i18n/format";
import Stars from "@/components/Stars";
import Avatar from "@/components/Avatar";
import ProfileActions from "@/components/ProfileActions";
import ReportButton from "@/components/ReportButton";
import { EmptyState } from "@/components/ui/States";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { id: string } }) {
  const u = await prisma.user.findUnique({ where: { id: params.id }, select: { name: true } });
  return { title: u?.name || getDict().errors.not_found };
}

/** Public profile. Works for freelancers (full profile) and clients (basic info + reviews). */
export default async function ProfilePage({ params }: { params: { id: string } }) {
  const t = getDict(); const lang = getLang();
  const me = await getCurrentUser();
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      profile: { include: { skillsRel: true, portfolioItems: { orderBy: { createdAt: "desc" } } } },
      clientProfile: true,
      reviewsRecv: { where: { hidden: false }, include: { fromUser: { select: { name: true, avatarUrl: true } }, project: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
      _count: { select: { freelancerOrders: { where: { status: "COMPLETED" } }, clientOrders: { where: { status: "COMPLETED" } } } },
    },
  });
  if (!user || (user.status !== "ACTIVE" && !me?.isAdmin)) notFound();
  const p = user.profile;
  const rating = avgRating(user.reviewsRecv);
  const openProjects = me && me.id !== user.id ? await prisma.project.findMany({ where: { clientId: me.id, status: "OPEN", hidden: false }, select: { id: true, title: true }, take: 20 }) : [];
  const skills = p ? (p.skillsRel.length ? p.skillsRel.map((s) => s.name) : parseSkills(p.skills)) : [];
  const stats = [
    { icon: Star, label: t.prof.rating, value: rating ?? "—" },
    { icon: CheckCircle2, label: t.prof.completed, value: p ? user._count.freelancerOrders : user._count.clientOrders },
    ...(p ? [{ icon: Briefcase, label: t.prof.experience, value: p.experienceYears }] : []),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-slide-up">
      <div className="card shadow-soft overflow-hidden !p-0">
        {p?.coverUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.coverUrl} alt="" className="h-32 w-full object-cover sm:h-44" /> : <div className="h-32 bg-hero-gradient sm:h-44" />}
        <div className="px-5 pb-6 sm:px-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="rounded-full ring-4 ring-white"><Avatar name={user.name} src={user.avatarUrl} size="lg" /></div>
              <div className="pb-1">
                <h1 className="text-2xl font-extrabold text-ink" data-testid="profile-name">{user.name}</h1>
                <p className="text-brand-700">{p?.title || user.clientProfile?.company || t.ord.client}</p>
              </div>
            </div>
            {p && <div className="rounded-2xl bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700">{fmt(t.prof.rate, { a: p.rateMin ?? p.hourlyRate, b: p.rateMax ?? p.hourlyRate })}</div>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden />{user.city}</span>
            {p && <span className="inline-flex items-center gap-1"><Languages className="h-4 w-4" aria-hidden />{p.languages}</span>}
            {p && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.available ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600"}`}>{p.available ? t.prof.available : t.prof.notAvailable}</span>}
            <span>{t.common.memberSince}: {fdate(user.createdAt, lang)}</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <ProfileActions userId={user.id} openProjects={openProjects} canInvite={!!p} />
            <ReportButton targetType="USER" targetId={user.id} />
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {stats.map((s) => <div key={s.label} className="card !p-4 text-center"><s.icon className="mx-auto h-5 w-5 text-brand-600" aria-hidden /><dd className="mt-1 text-xl font-extrabold text-ink">{s.value}</dd><dt className="text-xs text-ink-muted">{s.label}</dt></div>)}
      </dl>

      {(p?.bio || user.clientProfile?.about) && <section className="card"><h2 className="mb-2 font-bold text-ink">{t.prof.bio}</h2><p className="whitespace-pre-line text-ink-muted">{p?.bio || user.clientProfile?.about}</p>
        {skills.length > 0 && <ul className="mt-4 flex flex-wrap gap-2">{skills.map((s) => <li key={s} className="chip">{s}</li>)}</ul>}</section>}

      {p && (
        <section aria-labelledby="pf-h">
          <h2 id="pf-h" className="mb-3 text-lg font-bold text-ink">{t.prof.portfolio}</h2>
          {p.portfolioItems.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {p.portfolioItems.map((i) => { const img = i.images.split("\n").filter(Boolean)[0]; return (
                <article key={i.id} className="card overflow-hidden !p-0">
                  {img && /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt="" className="h-40 w-full object-cover" />}
                  <div className="p-4"><h3 className="font-bold text-ink">{i.title}</h3>{i.description && <p className="mt-1 line-clamp-3 text-sm text-ink-muted">{i.description}</p>}
                    {i.tech && <p className="mt-2 text-xs text-ink-muted">{i.tech}</p>}
                    {i.link && <a href={i.link} target="_blank" rel="noreferrer nofollow" className="mt-2 inline-flex min-h-[36px] items-center gap-1 text-sm"><ExternalLink className="h-3.5 w-3.5" aria-hidden />{i.link.replace(/^https?:\/\//, "").slice(0, 40)}</a>}</div>
                </article>); })}
            </div>
          ) : <EmptyState icon={Briefcase} title={t.prof.emptyPortfolio} />}
        </section>
      )}

      <section aria-labelledby="rv-h">
        <h2 id="rv-h" className="mb-3 text-lg font-bold text-ink">{t.prof.reviewsTitle} ({user.reviewsRecv.length})</h2>
        {user.reviewsRecv.length ? (
          <div className="space-y-3">{user.reviewsRecv.map((r) => (
            <div key={r.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2"><Avatar name={r.fromUser.name} src={r.fromUser.avatarUrl} size="sm" /><strong className="text-sm">{r.fromUser.name}</strong></span><Stars value={r.rating} /></div>
              {r.project && <p className="mt-1 text-xs text-ink-muted">{r.project.title}</p>}
              <p className="mt-2 text-sm text-ink-muted">{r.comment}</p>
              <div className="flex items-center justify-between text-xs text-ink-muted"><span>{fdate(r.createdAt, lang)}</span><ReportButton targetType="REVIEW" targetId={r.id} /></div>
            </div>))}</div>
        ) : <EmptyState icon={Star} title={t.rev.noReviews} hint={t.rev.noReviewsHint} />}
      </section>
      {me?.id === user.id && p && <Link href="/profile" className="btn-secondary no-underline">{t.prof.editTitle}</Link>}
    </div>
  );
}
