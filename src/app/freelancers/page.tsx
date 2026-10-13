import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import FreelancerRow from "@/components/FreelancerRow";

export const dynamic = "force-dynamic";
export const metadata = { title: "Фрилансерҳо" };

export default async function FreelancersPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || "").trim();
  const profiles = await prisma.freelancerProfile.findMany({
    where: q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { bio: { contains: q, mode: "insensitive" as const } }, { skills: { contains: q, mode: "insensitive" as const } }, { user: { name: { contains: q, mode: "insensitive" as const } } }] } : {},
    include: { user: { include: { reviewsRecv: true } } },
    orderBy: { createdAt: "asc" },
  });
  return (
    <div className="animate-slide-up">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 dark:text-white">Фрилансерҳо</h1>
      <p className="mt-1 text-sm muted">{profiles.length} мутахассиси санҷидашуда</p>
      <form className="mt-6 mb-6 flex max-w-2xl items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <Search className="ml-3 h-5 w-5 text-slate-400" />
        <input name="q" defaultValue={q} className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none" placeholder="Ном, маҳорат, унвон..." />
        <button className="btn-primary">Ҷустуҷӯ</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {profiles.map((f) => <FreelancerRow key={f.id} f={f} />)}
      </div>
      {!profiles.length && <div className="card py-12 text-center muted">Фрилансер ёфт нашуд.</div>}
    </div>
  );
}
