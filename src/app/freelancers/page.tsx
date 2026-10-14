import { Search, Users } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { avgRating } from "@/lib/auth";
import { parseSkills } from "@/lib/utils";
import { getDict } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import FreelancerCard from "@/components/FreelancerListCard";
import Pagination from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/States";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().prof.listTitle }; }
const SIZE = 12;

export default async function FreelancersPage({ searchParams }: { searchParams: { q?: string; available?: string; page?: string } }) {
  const t = getDict();
  const q = (searchParams.q || "").trim().slice(0, 100);
  const ci = "insensitive" as const;
  const where: Prisma.FreelancerProfileWhereInput = {
    user: { status: "ACTIVE" },
    ...(searchParams.available ? { available: true } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: ci } }, { bio: { contains: q, mode: ci } }, { skills: { contains: q, mode: ci } }, { skillsRel: { some: { name: { contains: q, mode: ci } } } }, { user: { name: { contains: q, mode: ci } } }] } : {}),
  };
  const page = Math.max(1, Number(searchParams.page) || 1);
  const [total, profiles] = await Promise.all([
    prisma.freelancerProfile.count({ where }),
    prisma.freelancerProfile.findMany({ where, include: { skillsRel: true, user: { include: { reviewsRecv: true } } }, orderBy: [{ available: "desc" }, { createdAt: "asc" }], skip: (page - 1) * SIZE, take: SIZE }),
  ]);
  return (
    <div className="animate-slide-up">
      <h1 className="page-title">{t.prof.listTitle}</h1>
      <p className="mt-1 text-sm text-ink-muted" aria-live="polite">{fmt(t.prof.listFound, { n: total })}</p>
      <form role="search" className="my-5 flex max-w-2xl flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-2 shadow-soft">
        <Search className="ml-2 h-5 w-5 text-slate-400" aria-hidden />
        <label htmlFor="fq" className="sr-only">{t.common.search}</label>
        <input id="fq" name="q" type="search" defaultValue={q} className="min-h-[44px] min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
        <label className="inline-flex min-h-[44px] items-center gap-2 px-2 text-sm"><input type="checkbox" name="available" value="1" defaultChecked={!!searchParams.available} className="h-4 w-4 accent-brand-600" />{t.prof.onlyAvailable}</label>
        <button className="btn-primary">{t.common.search}</button>
      </form>
      {profiles.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((f) => <FreelancerCard key={f.id} t={t} f={{ id: f.userId, name: f.user.name, avatarUrl: f.user.avatarUrl, city: f.user.city, title: f.title, skills: f.skillsRel.length ? f.skillsRel.map((s) => s.name) : parseSkills(f.skills), rating: avgRating(f.user.reviewsRecv), reviews: f.user.reviewsRecv.filter((r) => !r.hidden).length, rateMin: f.rateMin, rateMax: f.rateMax, hourlyRate: f.hourlyRate, available: f.available }} />)}
        </div>
      ) : <EmptyState icon={Users} title={t.sections.notFound} />}
      <Pagination page={page} pages={Math.ceil(total / SIZE)} params={searchParams as Record<string, string>} basePath="/freelancers" />
    </div>
  );
}
