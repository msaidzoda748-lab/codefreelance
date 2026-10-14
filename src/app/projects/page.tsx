import Link from "next/link";
import { Filter, PlusCircle, SearchX } from "lucide-react";
import { getDict, getLang } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { activeCategories, catName, searchProjects, type ProjectSearch } from "@/lib/queries/projects";
import ProjectCard from "@/components/ProjectCard";
import Pagination from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/States";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().pl.title }; }

export default async function ProjectsPage({ searchParams }: { searchParams: ProjectSearch }) {
  const t = getDict(); const lang = getLang();
  const [res, cats] = await Promise.all([searchProjects(searchParams), activeCategories()]);
  const sp = searchParams;
  const sel = "input";
  return (
    <div className="animate-slide-up">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">{t.pl.title}</h1>
          <p className="mt-1 text-sm text-ink-muted" aria-live="polite">{fmt(t.pl.found, { n: res.total })}</p>
        </div>
        <Link href="/projects/new" className="btn-primary hidden no-underline sm:inline-flex"><PlusCircle className="h-4 w-4" aria-hidden />{t.nav.post}</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
        <details className="card group h-fit lg:sticky lg:top-24" open>
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 font-bold text-ink lg:pointer-events-none"><Filter className="h-4 w-4 text-brand-600" aria-hidden />{t.common.filters}</summary>
          <form className="mt-3 space-y-3" role="search" aria-label={t.common.filters}>
            <div><label htmlFor="f-q" className="label">{t.pl.q}</label><input id="f-q" name="q" defaultValue={sp.q} className={sel} type="search" /></div>
            <div><label htmlFor="f-cat" className="label">{t.pl.category}</label>
              <select id="f-cat" name="category" defaultValue={sp.category || ""} className={sel}><option value="">{t.common.all}</option>{cats.map((c) => <option key={c.id} value={c.slug}>{catName(c, lang)}</option>)}</select></div>
            <div><label htmlFor="f-skill" className="label">{t.pl.skill}</label><input id="f-skill" name="skill" defaultValue={sp.skill} className={sel} placeholder="React, Figma…" /></div>
            <fieldset><legend className="label">{t.pl.budget}</legend>
              <div className="grid grid-cols-2 gap-2">
                <div><label htmlFor="f-bmin" className="sr-only">{t.pl.budgetMin}</label><input id="f-bmin" name="budgetMin" type="number" min={0} inputMode="numeric" placeholder={t.pl.budgetMin} defaultValue={sp.budgetMin} className={sel} /></div>
                <div><label htmlFor="f-bmax" className="sr-only">{t.pl.budgetMax}</label><input id="f-bmax" name="budgetMax" type="number" min={0} inputMode="numeric" placeholder={t.pl.budgetMax} defaultValue={sp.budgetMax} className={sel} /></div>
              </div></fieldset>
            <div><label htmlFor="f-dl" className="label">{t.pl.deadlineBefore}</label><input id="f-dl" name="deadlineBefore" type="date" defaultValue={sp.deadlineBefore} className={sel} /></div>
            <div><label htmlFor="f-lang" className="label">{t.pl.language}</label>
              <select id="f-lang" name="language" defaultValue={sp.language || ""} className={sel}><option value="">{t.common.all}</option>{(["tj", "ru", "en"] as const).map((l) => <option key={l} value={l}>{t.pl[`lang_${l}`]}</option>)}</select></div>
            <div><label htmlFor="f-status" className="label">{t.pl.statusLabel}</label>
              <select id="f-status" name="status" defaultValue={sp.status || ""} className={sel}><option value="">{t.status.OPEN}</option><option value="IN_PROGRESS">{t.status.IN_PROGRESS}</option><option value="COMPLETED">{t.status.COMPLETED}</option><option value="ALL">{t.common.all}</option></select></div>
            <div><label htmlFor="f-sort" className="label">{t.pl.sort}</label>
              <select id="f-sort" name="sort" defaultValue={sp.sort || ""} className={sel}><option value="">{t.pl.sortNew}</option><option value="budget_desc">{t.pl.sortHigh}</option><option value="budget_asc">{t.pl.sortLow}</option></select></div>
            <div className="flex gap-2 pt-1"><button className="btn-primary flex-1">{t.common.apply}</button><Link href="/projects" className="btn-secondary no-underline">{t.common.reset}</Link></div>
          </form>
        </details>
        <div className="min-w-0">
          {res.items.length ? (
            <div className="grid gap-4" data-testid="project-list">
              {res.items.map((p) => <ProjectCard key={p.id} showStatus={p.status !== "OPEN"} p={{ id: p.id, title: p.title, description: p.description, category: p.category, categoryLabel: catName(p.categoryRel, lang, p.category), skills: p.skills, budget: p.budget, budgetMin: p.budgetMin, budgetMax: p.budgetMax, coverUrl: p.coverUrl, city: p.city, createdAt: p.createdAt.toISOString(), status: p.status, proposals: p._count.proposals }} />)}
            </div>
          ) : <EmptyState icon={SearchX} title={t.sections.notFound} hint={t.sections.notFoundHint} />}
          <Pagination page={res.page} pages={res.pages} params={sp as Record<string, string>} basePath="/projects" />
        </div>
      </div>
    </div>
  );
}
