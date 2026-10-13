import Link from "next/link";
import { Filter, PlusCircle, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/utils";
import ProjectCard from "@/components/ProjectCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Лоиҳаҳо" };

export default async function ProjectsPage({ searchParams }: { searchParams: { q?: string; category?: string; status?: string } }) {
  const q = (searchParams.q || "").trim();
  const category = searchParams.category || "";
  const status = searchParams.status ?? "";
  const statusWhere = status === "ALL" ? {} : status ? { status } : { status: { in: ["OPEN", "IN_PROGRESS"] } };
  const projects = await prisma.project.findMany({
    where: {
      AND: [
        q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }, { skills: { contains: q, mode: "insensitive" as const } }, { city: { contains: q, mode: "insensitive" as const } }] } : {},
        category ? { category } : {},
        statusWhere,
      ],
    },
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="animate-slide-up">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white">Лоиҳаҳо</h1>
          <p className="mt-1 text-sm muted">{projects.length} лоиҳа ёфт шуд</p>
        </div>
        <Link href="/projects/new" className="btn-primary no-underline"><PlusCircle className="h-4 w-4" />Ҷойгир кардани лоиҳа</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <form className="card h-fit space-y-4 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 font-bold text-navy-900 dark:text-white"><Filter className="h-4 w-4 text-brand-600" />Филтрҳо</div>
          <div>
            <label className="label">Ҷустуҷӯ</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={q} className="input !pl-10" placeholder="Калимаҳои калидӣ, шаҳр..." />
            </div>
          </div>
          <div>
            <label className="label">Категория</label>
            <select name="category" defaultValue={category} className="input">
              <option value="">Ҳама</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ҳолат</label>
            <select name="status" defaultValue={status} className="input">
              <option value="">Фаъол</option>
              <option value="ALL">Ҳама</option>
              <option value="OPEN">Кушода</option>
              <option value="IN_PROGRESS">Дар ҷараён</option>
              <option value="COMPLETED">Анҷомёфта</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">Татбиқ кардан</button>
        </form>
        <div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => <ProjectCard key={p.id} p={p} showStatus />)}
          </div>
          {!projects.length && <div className="card py-12 text-center muted">Лоиҳа ёфт нашуд.</div>}
        </div>
      </div>
    </div>
  );
}
