import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Link2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { avgRating } from "@/lib/auth";
import { parseSkills } from "@/lib/utils";
import Stars from "@/components/Stars";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function FreelancerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      profile: true,
      reviewsRecv: {
        include: { fromUser: true, project: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user || user.role !== "FREELANCER" || !user.profile) notFound();
  const p = user.profile;
  const links = p.portfolio
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-slide-up">
      <div className="card shadow-soft overflow-hidden !p-0">
        <div className="h-28 bg-hero-gradient" />
        <div className="relative px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="rounded-full ring-4 ring-white dark:ring-slate-900">
                <Avatar name={user.name} src={user.avatarUrl} size="lg" />
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-extrabold">{user.name}</h1>
                <p className="text-brand-600 dark:text-brand-300">{p.title}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
              {p.hourlyRate} сом/соат
            </div>
          </div>
          <div className="mt-4">
            <Stars
              value={avgRating(user.reviewsRecv)}
              count={user.reviewsRecv.length}
            />
          </div>
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
            {p.bio || "Тавсиф ҳанӯз навишта нашудааст."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {parseSkills(p.skills).map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
          {links.length > 0 && (
            <div className="mt-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Link2 className="h-4 w-4" />
                Портфолио
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {links.map((l) => (
                  <li key={l}>
                    <a
                      href={l}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
                    >
                      {l}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold">Баҳоҳо</h2>
        <div className="space-y-3">
          {user.reviewsRecv.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 font-medium">
                  <Avatar name={r.fromUser.name} size="sm" />
                  {r.fromUser.name}
                </span>
                <Stars value={r.rating} />
              </div>
              <p className="mt-2 text-sm muted">{r.comment}</p>
              <Link
                href={`/projects/${r.projectId}`}
                className="mt-2 inline-block text-xs font-medium"
              >
                Лоиҳа: {r.project.title}
              </Link>
            </div>
          ))}
          {!user.reviewsRecv.length && (
            <p className="card text-center muted">Ҳанӯз баҳо нест.</p>
          )}
        </div>
      </section>
    </div>
  );
}
