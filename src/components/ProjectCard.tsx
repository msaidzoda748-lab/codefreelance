import Link from "next/link";
import { Bookmark, Briefcase, Clock, MapPin } from "lucide-react";
import { parseSkills, somoni, timeAgo } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

type P = { id: string; title: string; description: string; category: string; skills: string; budget: number; coverUrl: string | null; city: string; createdAt: Date; status: string };

export default function ProjectCard({ p, showStatus = false }: { p: P; showStatus?: boolean }) {
  const skills = parseSkills(p.skills);
  return (
    <Link href={`/projects/${p.id}`} className="group block overflow-hidden rounded-2xl border border-slate-200/80 bg-white no-underline text-inherit shadow-card transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="relative aspect-[16/7] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.coverUrl || "/img/covers/website.svg"} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        {showStatus && <span className="absolute left-3 top-3"><StatusBadge status={p.status} /></span>}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-snug text-navy-900 dark:text-white">{p.title}</h3>
          <span className="rounded-lg border border-slate-200 p-1.5 text-slate-500 dark:border-slate-700"><Bookmark className="h-4 w-4" /></span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{p.category}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.city}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeAgo(p.createdAt)}</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-extrabold text-brand-600">{somoni(p.budget)}</div>
            <div className="text-[11px] text-slate-400">Буҷет</div>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{p.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.slice(0, 3).map((s) => <span key={s} className="chip-blue">{s}</span>)}
          {skills.length > 3 && <span className="chip">+{skills.length - 3}</span>}
        </div>
      </div>
    </Link>
  );
}
