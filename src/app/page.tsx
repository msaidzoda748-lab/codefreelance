import Link from "next/link";
import {
  ArrowRight, BarChart3, ChevronRight, Code2, FileText, Heart, Monitor,
  Palette, Search, ShieldCheck, Sparkles, Users, BadgeCheck, MessageSquare, Briefcase,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import ProjectCard from "@/components/ProjectCard";
import FreelancerRow from "@/components/FreelancerRow";
import Avatar from "@/components/Avatar";
import Stars from "@/components/Stars";
import { avgRating } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CATS = [
  { label: "Вебсайт", q: "Веб-таҳия", icon: Monitor, cls: "bg-brand-50 text-brand-800 hover:bg-brand-100", ic: "text-brand-600" },
  { label: "Дизайн", q: "Дизайн", icon: Palette, cls: "bg-purple-50 text-purple-800 hover:bg-purple-100", ic: "text-purple-600" },
  { label: "Барномасозӣ", q: "Мобилӣ", icon: Code2, cls: "bg-sky-50 text-sky-800 hover:bg-sky-100", ic: "text-sky-600" },
  { label: "Маркетинг", q: "Маркетинг", icon: BarChart3, cls: "bg-orange-50 text-orange-800 hover:bg-orange-100", ic: "text-orange-500" },
];

export default async function HomePage() {
  const [projects, profiles, projectCount, freelancerCount, reviews] = await Promise.all([
    prisma.project.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.freelancerProfile.findMany({ include: { user: { include: { reviewsRecv: true } } } }),
    prisma.project.count(),
    prisma.freelancerProfile.count(),
    prisma.review.findMany({ select: { rating: true } }),
  ]);
  const top = profiles
    .map((f) => ({ f, avg: avgRating(f.user.reviewsRecv) ?? 0, n: f.user.reviewsRecv.length }))
    .sort((a, b) => b.avg - a.avg || b.n - a.n)
    .slice(0, 3)
    .map((x) => x.f);
  const hero = top.find((f) => f.title.includes("UI")) || top[0];
  const satisfied = reviews.length ? Math.round((reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100) : 100;

  return (
    <div className="-mt-8 space-y-14 pb-6">
      {/* HERO */}
      <section className="grid items-center gap-10 pt-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="animate-slide-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3.5 py-1.5 text-xs font-medium text-purple-700 ring-1 ring-purple-100">
            <Sparkles className="h-3.5 w-3.5" /> Мутахассисони маҳаллӣ. Имкониятҳои ҷаҳонӣ.
          </span>
          <h1 className="mt-5 text-[38px] font-extrabold leading-[1.08] tracking-tight lg:text-[52px] xl:text-[58px]">
            <span className="block text-navy-900 dark:text-white">Истеъдодро ёб.</span>
            <span className="block text-brand-600">Лоиҳаатро амалӣ кун.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-slate-600 dark:text-slate-300">
            CodeFreelance — платформаи боэътимод барои ёфтани фрилансерҳои моҳир ва амалӣ кардани лоиҳаҳо дар Тоҷикистон ва берун аз он.
          </p>
          <form action="/projects" className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft dark:border-slate-700 dark:bg-slate-900">
            <Search className="ml-3 h-5 w-5 shrink-0 text-slate-400" />
            <input name="q" placeholder="Чӣ гуна лоиҳаро меҷӯед? (масалан: вебсайт, дизайн, маркетинг...)" className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-navy-900 outline-none placeholder:text-slate-400 dark:text-white" />
            <button className="btn-primary !px-6 !py-3"><Search className="h-4 w-4" />Ҷустуҷӯ</button>
          </form>
          <div className="mt-5 flex flex-wrap gap-3">
            {CATS.map((c) => (
              <Link key={c.label} href={`/projects?category=${encodeURIComponent(c.q)}`} className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium no-underline transition ${c.cls}`}>
                <c.icon className={`h-4 w-4 ${c.ic}`} />{c.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[600px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/hero-sculpture.svg" alt="" className="w-full rounded-[28px]" />
          {hero && (
            <Link href={`/freelancers/${hero.userId}`} className="float-card absolute left-0 top-6 flex w-[230px] gap-3 no-underline text-inherit sm:-left-6">
              <div className="relative h-16 w-16 shrink-0 self-start">
                <Avatar name={hero.user.name} src={hero.user.avatarUrl} size="lg" />
                <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-brand-500 ring-2 ring-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-navy-900">{hero.user.name}</div>
                <div className="text-xs text-slate-500">{hero.title}</div>
                <Stars value={avgRating(hero.user.reviewsRecv)} />
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700"><BadgeCheck className="h-3 w-3" />Дастрас аст</span>
              </div>
            </Link>
          )}
          <div className="float-card absolute right-0 top-8 hidden items-center gap-2.5 sm:flex sm:-right-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><BarChart3 className="h-4 w-4" /></span>
            <div className="text-xs leading-tight"><div className="font-semibold text-navy-900">Сифати баланд</div><div className="text-slate-500">Натиҷаи воқеӣ</div></div>
          </div>
          <div className="float-card absolute bottom-24 right-0 hidden items-center gap-2.5 sm:flex sm:-right-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Users className="h-4 w-4" /></span>
            <div className="text-xs leading-tight font-semibold text-navy-900">Фрилансерҳои<br />боэътимод</div>
          </div>
        </div>
      </section>

      {/* FEATURED + SIDEBAR */}
      <section className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title flex items-center gap-3">Лоиҳаҳои интихобӣ <span className="rounded-full bg-slate-100 p-1.5 dark:bg-slate-800"><ChevronRight className="h-4 w-4" /></span></h2>
            <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-800 no-underline hover:text-brand-600">Ҳама лоиҳаҳо <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
          </div>
        </div>
        <aside className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-4 flex items-center justify-between px-1">
            <h2 className="text-base font-extrabold text-navy-900 dark:text-white">Фрилансерҳои беҳтарин</h2>
            <Link href="/freelancers" className="inline-flex items-center gap-1 text-xs font-semibold text-navy-800 no-underline hover:text-brand-600">Ҳама фрилансерҳо <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="space-y-3">{top.map((f) => <FreelancerRow key={f.id} f={f} />)}</div>
        </aside>
      </section>

      {/* HOW */}
      <section id="how" className="scroll-mt-24">
        <h2 className="section-title text-center">Чӣ тавр кор мекунад?</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            { t: "Лоиҳаро ҷойгир кунед", d: "Тавсиф, буҷет ва мӯҳлатро нависед — ройгон.", i: Briefcase },
            { t: "Пешниҳодҳо гиред", d: "Фрилансерҳои санҷидашуда нарх ва мӯҳлат пешниҳод мекунанд.", i: FileText },
            { t: "Ҳамкорӣ ва баҳо", d: "Дар чат кор кунед, лоиҳаро анҷом диҳед ва баҳо гузоред.", i: MessageSquare },
          ].map((s, i) => (
            <div key={s.t} className="card text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><s.i className="h-5 w-5" /></span>
              <div className="mt-3 text-xs font-bold uppercase tracking-widest text-brand-600">Қадами {i + 1}</div>
              <h3 className="mt-1 font-bold text-navy-900 dark:text-white">{s.t}</h3>
              <p className="mt-1 text-sm muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS BAR */}
      <section className="grid gap-6 rounded-2xl border border-slate-200/80 bg-white px-6 py-6 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-slate-100">
        {[
          { v: `${projectCount}+`, l: "Лоиҳаҳои ҷойгиршуда", i: FileText },
          { v: `${freelancerCount}+`, l: "Фрилансерҳои мутахассис", i: Users },
          { v: `${satisfied}%`, l: "Мизоҷони қаноатманд", i: ShieldCheck },
        ].map((s) => (
          <div key={s.l} className="flex items-center gap-4 lg:px-4">
            <s.i className="h-9 w-9 text-brand-600" strokeWidth={1.6} />
            <div><div className="text-2xl font-extrabold text-navy-900 dark:text-white">{s.v}</div><div className="text-sm muted">{s.l}</div></div>
          </div>
        ))}
        <div className="flex items-center gap-3 lg:px-6">
          <Heart className="h-6 w-6 shrink-0 fill-rose-500 text-rose-500" />
          <p className="text-sm text-slate-600 dark:text-slate-300">Барои рушди имкониятҳо дар Тоҷикистон ва берун аз он.</p>
        </div>
      </section>
    </div>
  );
}
