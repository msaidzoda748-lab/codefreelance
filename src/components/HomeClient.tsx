"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Briefcase, FileText, Heart, MessageSquare, SearchX, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { HOME_CATEGORIES, type CatKey } from "@/data/categories";
import { HERO_IMAGE } from "@/data/home";
import HeroSearch from "./HeroSearch";
import CategoryFilter from "./CategoryFilter";
import ProjectCard, { type ProjectCardData } from "./ProjectCard";
import FreelancerCard, { type FreelancerCardData } from "./FreelancerCard";

export default function HomeClient({ projects, freelancers, stats }: { projects: ProjectCardData[]; freelancers: FreelancerCardData[]; stats: { projectCount: number; freelancerCount: number; satisfied: number } }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CatKey>("all");
  const listRef = useRef<HTMLElement>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase();
    const vals = HOME_CATEGORIES.find((c) => c.key === cat)?.values ?? [];
    return projects.filter((p) =>
      (!vals.length || vals.includes(p.category)) &&
      (!needle || p.title.toLocaleLowerCase().includes(needle) || p.description.toLocaleLowerCase().includes(needle)));
  }, [projects, q, cat]);

  return (
    <div className="-mt-2 space-y-10 pb-4 sm:space-y-14">
      <section className="relative grid items-center gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pt-4">
        <div className="pointer-events-none absolute -inset-x-40 -top-24 -z-10 h-[520px] bg-brand-mesh" aria-hidden />
        <div className="min-w-0 animate-slide-up">
          <span className="hidden items-center gap-2 rounded-full bg-purple-50 px-3.5 py-1.5 text-xs font-semibold text-purple-700 ring-1 ring-purple-100 sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />{t.hero.badge}
          </span>
          <h1 className="text-[clamp(28px,7.4vw,34px)] font-extrabold leading-[1.12] tracking-tight sm:mt-5 sm:text-[44px] lg:text-[46px] xl:text-[52px]">
            <span className="block text-ink dark:text-white">{t.hero.title1}</span>
            <span className="block bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-400 bg-clip-text text-transparent">{t.hero.title2}</span>
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:mt-5 sm:text-[17px]">{t.hero.text}</p>
          <div className="mt-5 max-w-xl sm:mt-7">
            <HeroSearch value={q} onChange={setQ} onSubmit={() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />
          </div>
          <div className="sticky top-[60px] z-30 -mx-4 mt-4 bg-[var(--bg)]/85 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:mt-5 sm:bg-transparent sm:p-0 sm:backdrop-blur-none"><CategoryFilter value={cat} onChange={setCat} /></div>
        </div>
        <div className="relative mx-auto hidden w-full max-w-[560px] lg:block" aria-hidden>
          <div className="relative aspect-[1.05] overflow-hidden rounded-[32px] border border-white/70 bg-gradient-to-br from-brand-50 via-white to-emerald-100/60 shadow-card dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950">
            <div className="absolute inset-0 bg-brand-mesh" />
            <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[conic-gradient(from_200deg,#059669,#34d399,#a7f3d0,#059669)] opacity-90 blur-[2px] motion-safe:animate-float-slow" />
            <div className="absolute right-10 top-10 h-56 w-56 rounded-full border-[18px] border-white/50 bg-white/10 shadow-glass backdrop-blur-md motion-safe:animate-float" />
            <div className="absolute bottom-16 left-12 h-32 w-32 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 shadow-lift motion-safe:animate-float-slow" />
            <div className="absolute bottom-0 left-1/2 h-24 w-[70%] -translate-x-1/2 rounded-[50%] bg-gradient-to-b from-slate-200/80 to-slate-300/40 dark:from-slate-800 dark:to-slate-900" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_IMAGE} alt="" className="absolute bottom-10 left-1/2 w-[62%] -translate-x-1/2 drop-shadow-2xl" />
          </div>
          {freelancers[0] && (
            <div className="glass absolute -left-8 top-10 w-56 rounded-2xl p-3 motion-safe:animate-float">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={freelancers[0].avatarUrl || "/img/avatars/user.svg"} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white" />
                <div className="min-w-0 text-xs leading-tight"><div className="truncate font-bold text-ink">{freelancers[0].name}</div><div className="truncate text-ink-muted">{freelancers[0].title}</div>
                  <div className="mt-1 flex items-center gap-1 text-amber-500">{"★★★★★"}<span className="font-semibold text-ink">{freelancers[0].rating?.toFixed(1) ?? "5.0"}</span></div></div>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />{t.card.verified}</span>
            </div>
          )}
          <div className="glass absolute -right-6 top-24 flex items-center gap-2.5 rounded-2xl p-3 motion-safe:animate-float-slow">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><BarChart3 className="h-4 w-4" /></span>
            <div className="text-xs leading-tight"><div className="font-semibold text-ink">{t.hero.quality}</div><div className="text-ink-muted">{t.hero.qualitySub}</div></div>
          </div>
          <div className="glass absolute -right-2 bottom-12 flex items-center gap-2.5 rounded-2xl p-3 motion-safe:animate-float">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600"><Users className="h-4 w-4" /></span>
            <div className="text-xs font-semibold leading-tight text-ink">{t.hero.trusted}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section ref={listRef} aria-labelledby="new-projects" className="min-w-0 scroll-mt-24">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="new-projects" className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl dark:text-white">{t.sections.newProjects}</h2>
            <Link href="/projects" className="inline-flex min-h-[44px] items-center gap-1 rounded-xl px-2 text-sm font-semibold text-brand-700 no-underline hover:text-brand-800 hover:underline">{t.sections.seeAll}<ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <p className="sr-only" aria-live="polite">{filtered.length} {t.sections.found}</p>
          {filtered.length ? (
            <div className="grid gap-4">{filtered.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
          ) : (
            <div className="rounded-card border border-dashed border-line bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <SearchX className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
              <p className="mt-3 text-base font-bold text-ink dark:text-white">{t.sections.notFound}</p>
              <p className="mt-1 text-sm text-ink-muted">{t.sections.notFoundHint}</p>
              <button type="button" onClick={() => { setQ(""); setCat("all"); }} className="btn-secondary mt-4">{t.sections.reset}</button>
            </div>
          )}
        </section>
        <aside aria-labelledby="top-freelancers" className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="top-freelancers" className="whitespace-nowrap text-xl font-extrabold lg:text-lg tracking-tight text-ink dark:text-white">{t.sections.topFreelancers}</h2>
            <Link href="/freelancers" className="inline-flex min-h-[44px] shrink-0 items-center gap-1 whitespace-nowrap rounded-xl px-2 text-sm font-semibold text-brand-700 no-underline hover:underline">{t.sections.seeAll}<ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{freelancers.map((f) => <FreelancerCard key={f.userId} f={f} />)}</div>
        </aside>
      </section>

      <section id="how" className="scroll-mt-24">
        <h2 className="text-center text-xl font-extrabold text-ink sm:text-2xl dark:text-white">{t.how.title}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[{ s: t.how.s1, d: t.how.d1, i: Briefcase }, { s: t.how.s2, d: t.how.d2, i: FileText }, { s: t.how.s3, d: t.how.d3, i: MessageSquare }].map((x, i) => (
            <div key={x.s} className="card text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><x.i className="h-5 w-5" aria-hidden /></span>
              <div className="mt-3 text-xs font-bold uppercase tracking-widest text-brand-600">{t.how.step} {i + 1}</div>
              <h3 className="mt-1 font-bold text-ink dark:text-white">{x.s}</h3>
              <p className="mt-1 text-sm text-ink-muted">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 rounded-card border border-line bg-white p-5 shadow-card sm:grid-cols-2 sm:p-6 lg:grid-cols-4 lg:divide-x lg:divide-line dark:border-slate-800 dark:bg-slate-900">
        {[{ v: `${stats.projectCount}+`, l: t.stats.projects, i: FileText }, { v: `${stats.freelancerCount}+`, l: t.stats.freelancers, i: Users }, { v: `${stats.satisfied}%`, l: t.stats.satisfied, i: ShieldCheck }].map((s) => (
          <div key={s.l} className="flex items-center gap-4 lg:px-4">
            <s.i className="h-9 w-9 text-brand-600" strokeWidth={1.6} aria-hidden />
            <div><div className="text-2xl font-extrabold text-ink dark:text-white">{s.v}</div><div className="text-sm text-ink-muted">{s.l}</div></div>
          </div>
        ))}
        <div className="flex items-center gap-3 lg:px-6">
          <Heart className="h-6 w-6 shrink-0 fill-rose-500 text-rose-500" aria-hidden />
          <p className="text-sm text-ink-muted">{t.stats.note}</p>
        </div>
      </section>
    </div>
  );
}
