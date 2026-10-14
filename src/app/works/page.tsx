import Link from "next/link";
import { Plus, Search, Sparkles } from "lucide-react";
import { getDict, getLang } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { getCurrentUser } from "@/lib/auth";
import { activeCategories, catName } from "@/lib/queries/projects";
import { searchWorks, topTech } from "@/lib/queries/works";
import WorkCard from "@/components/works/WorkCard";
import Pagination from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/States";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().works.title }; }

type SP = { q?: string; category?: string; tech?: string; sort?: string; page?: string };
export default async function WorksPage({ searchParams }: { searchParams: SP }) {
  const t = getDict(); const lang = getLang();
  const me = await getCurrentUser();
  const [cats, techs, r] = await Promise.all([activeCategories(), topTech(), searchWorks({ ...searchParams, page: Number(searchParams.page) || 1 })]);
  const chip = (active: boolean) => `inline-flex min-h-[40px] shrink-0 snap-start items-center rounded-full px-4 text-sm font-semibold no-underline transition duration-200 ${active ? "bg-brand-600 text-white shadow-[0_6px_16px_-8px_rgba(5,150,105,.8)]" : "bg-white text-navy-800 ring-1 ring-line hover:ring-brand-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"}`;
  const qs = (patch: Partial<SP>) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries({ ...searchParams, ...patch, page: undefined })) if (v) p.set(k, v); const s = p.toString(); return s ? `/works?${s}` : "/works"; };
  return (
    <div className="space-y-6 animate-slide-up">
      <header className="relative overflow-hidden rounded-[28px] bg-brand-mesh px-5 py-8 sm:px-10 sm:py-12">
        <p className="eyebrow flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" aria-hidden />{t.nav.works}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="page-title" data-testid="works-title">{t.works.title}</h1>
            <p className="mt-2 text-ink-muted">{t.works.subtitle}</p>
          </div>
          {me?.role === "FREELANCER" && <Link href="/works/new" className="btn-primary no-underline" data-testid="work-add"><Plus className="h-4 w-4" aria-hidden />{t.works.add}</Link>}
        </div>
        <form role="search" action="/works" className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row">
          {searchParams.category && <input type="hidden" name="category" value={searchParams.category} />}
          <label htmlFor="wq" className="sr-only">{t.common.search}</label>
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden /><input id="wq" name="q" type="search" defaultValue={searchParams.q} placeholder={t.works.search} className="input !pl-11" /></div>
          <label htmlFor="wtech" className="sr-only">{t.works.tech}</label>
          <select id="wtech" name="tech" defaultValue={searchParams.tech || ""} className="input sm:w-48"><option value="">{t.works.allTech}</option>{techs.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <label htmlFor="wsort" className="sr-only">Sort</label>
          <select id="wsort" name="sort" defaultValue={r.sort} className="input sm:w-40"><option value="new">{t.works.sortNew}</option><option value="popular">{t.works.sortPopular}</option><option value="old">{t.works.sortOld}</option></select>
          <button className="btn-primary">{t.common.search}</button>
        </form>
      </header>

      <nav aria-label={t.pf.category} className="sticky top-[60px] z-30 -mx-4 bg-white/85 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0 dark:bg-slate-950/85 sm:dark:bg-transparent">
        <div className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <Link href={qs({ category: undefined })} className={chip(!searchParams.category)}>{t.works.allCats}</Link>
          {cats.map((c) => <Link key={c.id} href={qs({ category: c.slug })} className={chip(searchParams.category === c.slug)} aria-current={searchParams.category === c.slug ? "page" : undefined}>{catName(c, lang)}</Link>)}
        </div>
      </nav>

      <p className="text-sm text-ink-muted" aria-live="polite">{fmt(t.common.page, { n: r.page, total: r.pages })} · {r.total}</p>
      {r.items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="works-grid">
          {r.items.map((w) => <WorkCard key={w.id} t={t} w={{ ...w, category: w.category ? catName(w.category, lang) : undefined, author: w.profile.user }} />)}
        </div>
      ) : <EmptyState title={t.works.empty} hint={t.works.emptyHint} />}
      <Pagination page={r.page} pages={r.pages} params={{ ...searchParams }} basePath="/works" />
    </div>
  );
}
