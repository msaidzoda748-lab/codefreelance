import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Code2,
  MessageSquare,
  Palette,
  PenLine,
  Search,
  Smartphone,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { avgRating } from "@/lib/auth";
import { CATEGORIES, formatMoney } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import Stars from "@/components/Stars";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

const CAT_ICONS: Record<string, typeof Code2> = {
  "Веб-таҳия": Code2,
  Мобилӣ: Smartphone,
  Дизайн: Palette,
  Тарҷума: PenLine,
  Маркетинг: Sparkles,
  Навиштан: PenLine,
  Дигар: Briefcase,
};

export default async function HomePage() {
  const [projects, freelancers, counts] = await Promise.all([
    prisma.project.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { client: true, _count: { select: { proposals: true } } },
    }),
    prisma.freelancerProfile.findMany({
      take: 4,
      include: { user: { include: { reviewsRecv: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.$transaction([
      prisma.project.count({ where: { status: "OPEN" } }),
      prisma.freelancerProfile.count(),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.review.count(),
    ]),
  ]);

  return (
    <div className="space-y-16 pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-hero-gradient px-6 py-14 text-white shadow-glow sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center animate-slide-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Платформаи #1 фриланс барои Тоҷикистон
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl sm:leading-tight">
            Кор ва мутахассисони беҳтарин{" "}
            <span className="text-violet-200">дар як ҷо</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-indigo-100 sm:text-lg">
            CodeFreelance — лоиҳа эълон кунед, пешниҳод гиред, сӯҳбат кунед ва
            бо эътимод ҳамкорӣ кунед.
          </p>

          <form
            action="/projects"
            className="mx-auto mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-white/15 p-2 shadow-soft backdrop-blur-xl sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              <input
                name="q"
                placeholder="Масалан: вебсайт, дизайн, Flutter..."
                className="w-full rounded-xl border-0 bg-white/90 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button type="submit" className="btn bg-slate-900 text-white hover:bg-slate-800 sm:shrink-0">
              Ҷустуҷӯ
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/projects"
              className="btn bg-white text-brand-800 no-underline hover:bg-indigo-50"
            >
              Дидани лоиҳаҳо
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="btn border border-white/40 bg-white/10 text-white no-underline backdrop-blur hover:bg-white/20"
            >
              Ройгон оғоз кунед
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Лоиҳаи кушода", value: counts[0], icon: Briefcase },
          { label: "Фрилансер", value: counts[1], icon: Users },
          { label: "Мизоҷ", value: counts[2], icon: Sparkles },
          { label: "Баҳоҳо", value: counts[3], icon: Star },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-accent-500/15 text-brand-600 dark:text-brand-300">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight">
                {s.value}
              </div>
              <div className="text-sm muted">{s.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Категорияҳо</h2>
            <p className="mt-1 text-sm muted">
              Соҳаи кори худро интихоб кунед
            </p>
          </div>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const Icon = CAT_ICONS[c] || Briefcase;
            return (
              <Link
                key={c}
                href={`/projects?category=${encodeURIComponent(c)}`}
                className="card-hover group flex flex-col items-start gap-3 no-underline text-inherit"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-500/15 dark:text-brand-300">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-semibold">{c}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-8 shadow-card dark:border-slate-700/60 dark:from-slate-900 dark:to-slate-950 sm:p-10">
        <h2 className="section-title text-center">Чӣ тавр кор мекунад?</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm muted">
          Се қадами оддӣ то оғози ҳамкорӣ
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Сабти ном",
              desc: "Ҳамчун мизоҷ ё фрилансер ба қайд гиред — ройгон ва зуд.",
              icon: Users,
            },
            {
              step: "02",
              title: "Лоиҳа ё пешниҳод",
              desc: "Лоиҳа эълон кунед ё ба лоиҳаҳои кушода пешниҳод диҳед.",
              icon: Briefcase,
            },
            {
              step: "03",
              title: "Чат ва анҷом",
              desc: "Ҳамкорӣ кунед, чат кунед ва пас аз анҷом баҳо диҳед.",
              icon: MessageSquare,
            },
          ].map((item) => (
            <div key={item.step} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-soft">
                <item.icon className="h-6 w-6" />
              </div>
              <div className="mt-2 text-xs font-bold uppercase tracking-widest text-brand-500">
                Қадами {item.step}
              </div>
              <h3 className="mt-1 text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="section-title">Лоиҳаҳои кушода</h2>
            <p className="mt-1 text-sm muted">Имкониятҳои навтарин</p>
          </div>
          <Link
            href="/projects"
            className="btn-ghost no-underline text-brand-600"
          >
            Ҳама <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="card-hover block no-underline text-inherit"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="font-bold leading-snug text-slate-900 dark:text-white">
                  {p.title}
                </h3>
                <StatusBadge status={p.status} />
              </div>
              <p className="line-clamp-2 text-sm muted">{p.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                <span className="font-bold text-brand-600 dark:text-brand-300">
                  {formatMoney(p.budget)}
                </span>
                <span className="muted">{p.category}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Freelancers */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="section-title">Фрилансерҳои барҷаста</h2>
            <p className="mt-1 text-sm muted">Мутахассисони тайёр ба кор</p>
          </div>
          <Link
            href="/freelancers"
            className="btn-ghost no-underline text-brand-600"
          >
            Ҳама <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {freelancers.map((f) => (
            <Link
              key={f.id}
              href={`/freelancers/${f.userId}`}
              className="card-hover block no-underline text-inherit"
            >
              <div className="flex items-center gap-3">
                <Avatar name={f.user.name} src={f.user.avatarUrl} />
                <div>
                  <div className="font-bold">{f.user.name}</div>
                  <div className="text-sm text-brand-600 dark:text-brand-300">
                    {f.title}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <Stars
                  value={avgRating(f.user.reviewsRecv)}
                  count={f.user.reviewsRecv.length}
                />
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {f.hourlyRate} сом/соат
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <h2 className="section-title text-center">Фикрҳои корбарон</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm muted">
          Чӣ мегӯянд мизоҷон ва фрилансерҳо
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              name: "Заррина Қаюмова",
              role: "Мизоҷ",
              text: "Зуд фрилансери хуб ёфтам. Чат ва баҳогузорӣ хеле қулай аст.",
            },
            {
              name: "Дилшод Неъматов",
              role: "Фрилансер",
              text: "Лоиҳаҳои воқеӣ ва интерфейси зебо. Барои Тоҷикистон идеалӣ!",
            },
            {
              name: "Мадина Саидова",
              role: "Дизайнер",
              text: "Профил ва портфолио маро ба мизоҷони нав пайваст кард.",
            },
          ].map((t) => (
            <div key={t.name} className="card relative overflow-hidden">
              <div className="absolute -right-2 -top-2 text-6xl font-serif text-brand-100 dark:text-brand-900/40">
                “
              </div>
              <div className="mb-3 flex gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="relative text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t.text}
              </p>
              <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Avatar name={t.name} size="sm" />
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs muted">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="overflow-hidden rounded-3xl bg-slate-900 px-8 py-12 text-center text-white shadow-card dark:bg-gradient-to-br dark:from-brand-950 dark:to-slate-950 sm:px-12">
        <CheckCircle2 className="mx-auto h-10 w-10 text-brand-400" />
        <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
          Омодаед оғоз кунед?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
          Имрӯз ба CodeFreelance ҳамроҳ шавед ва аввалин лоиҳаи худро пайдо
          кунед.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="btn-primary no-underline">
            Сабти ном
          </Link>
          <Link
            href="/projects"
            className="btn border border-white/20 bg-white/5 text-white no-underline hover:bg-white/10"
          >
            Лоиҳаҳоро дидан
          </Link>
        </div>
      </section>
    </div>
  );
}
