import Link from "next/link";
import { Filter, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, formatMoney, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Лоиҳаҳо" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; status?: string };
}) {
  const q = (searchParams.q || "").trim();
  const category = searchParams.category || "";
  const status = searchParams.status || "";

  const projects = await prisma.project.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q } },
                { description: { contains: q } },
                { skills: { contains: q } },
              ],
            }
          : {},
        category ? { category } : {},
        status ? { status } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      _count: { select: { proposals: true } },
    },
  });

  return (
    <div className="animate-slide-up">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title">Лоиҳаҳо</h1>
          <p className="mt-1 text-sm muted">{projects.length} лоиҳа ёфт шуд</p>
        </div>
        <Link href="/projects/new" className="btn-primary no-underline">
          <Plus className="h-4 w-4" />
          Эълони лоиҳа
        </Link>
      </div>

      <form className="card mb-6 grid gap-3 shadow-soft sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label">Ҷустуҷӯ</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              className="input !pl-10"
              placeholder="Калимаҳои калидӣ..."
            />
          </div>
        </div>
        <div>
          <label className="label">Категория</label>
          <select name="category" defaultValue={category} className="input">
            <option value="">Ҳама</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Ҳолат</label>
          <select name="status" defaultValue={status} className="input">
            <option value="">Ҳама</option>
            <option value="OPEN">Кушода</option>
            <option value="IN_PROGRESS">Дар ҷараён</option>
            <option value="COMPLETED">Анҷомёфта</option>
          </select>
        </div>
        <div className="sm:col-span-4">
          <button type="submit" className="btn-primary">
            <Filter className="h-4 w-4" />
            Филтр
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="card-hover block no-underline text-inherit"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {p.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm muted">{p.description}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <span className="font-bold text-brand-600 dark:text-brand-300">
                {formatMoney(p.budget)}
              </span>
              <span className="chip">{p.category}</span>
              <span className="muted">Мӯҳлат: {formatDate(p.deadline)}</span>
              <span className="muted">{p._count.proposals} пешниҳод</span>
              <span className="inline-flex items-center gap-1.5 muted">
                <Avatar name={p.client.name} size="sm" />
                {p.client.name}
              </span>
            </div>
          </Link>
        ))}
        {!projects.length && (
          <div className="card py-12 text-center muted">Лоиҳа ёфт нашуд.</div>
        )}
      </div>
    </div>
  );
}
