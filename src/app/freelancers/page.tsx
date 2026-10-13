import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { avgRating } from "@/lib/auth";
import { parseSkills } from "@/lib/utils";
import Stars from "@/components/Stars";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Фрилансерҳо" };

export default async function FreelancersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || "").trim();
  const profiles = await prisma.freelancerProfile.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q } },
            { bio: { contains: q } },
            { skills: { contains: q } },
            { user: { name: { contains: q } } },
          ],
        }
      : {},
    include: { user: { include: { reviewsRecv: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-slide-up">
      <h1 className="section-title">Фрилансерҳо</h1>
      <p className="mt-1 mb-6 text-sm muted">{profiles.length} мутахассис</p>

      <form className="card mb-6 flex flex-wrap gap-3 shadow-soft">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            className="input !pl-10"
            placeholder="Ном, маҳорат, унвон..."
          />
        </div>
        <button type="submit" className="btn-primary">
          Ҷустуҷӯ
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        {profiles.map((f) => (
          <Link
            key={f.id}
            href={`/freelancers/${f.userId}`}
            className="card-hover block no-underline text-inherit"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={f.user.name} src={f.user.avatarUrl} />
                <div>
                  <h2 className="font-bold">{f.user.name}</h2>
                  <div className="text-sm text-brand-600 dark:text-brand-300">
                    {f.title}
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-brand-50 px-2.5 py-1 text-sm font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                {f.hourlyRate} сом/соат
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm muted">{f.bio}</p>
            <div className="mt-3">
              <Stars
                value={avgRating(f.user.reviewsRecv)}
                count={f.user.reviewsRecv.length}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {parseSkills(f.skills)
                .slice(0, 5)
                .map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
