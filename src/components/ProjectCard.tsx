"use client";
import { useState } from "react";
import Link from "next/link";
import { Bookmark, Clock, MapPin, Send } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useBookmarks } from "@/lib/bookmarks";
import { somoniT, timeAgoT } from "@/lib/timeago";
import { catKeyOf } from "@/data/categories";
import ProposalModal from "./ProposalModal";
import StatusBadge from "./StatusBadge";

export type ProjectCardData = { id: string; title: string; description: string; category: string; skills: string; budget: number; coverUrl: string | null; city: string; createdAt: string | Date; status: string };

const TONE: Record<string, string> = { design: "bg-purple-50 text-purple-700 ring-purple-100", dev: "bg-sky-50 text-sky-700 ring-sky-100", bots: "bg-amber-50 text-amber-700 ring-amber-100", marketing: "bg-orange-50 text-orange-700 ring-orange-100", web: "bg-brand-50 text-brand-700 ring-brand-100", all: "bg-slate-100 text-slate-700 ring-slate-200" };

export default function ProjectCard({ p, showStatus = false }: { p: ProjectCardData; showStatus?: boolean }) {
  const { t } = useI18n();
  const { has, toggle } = useBookmarks();
  const [open, setOpen] = useState(false);
  const saved = has(p.id);
  const skills = p.skills.split(",").map((s) => s.trim()).filter(Boolean);
  const ck = catKeyOf(p.category);
  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft sm:flex-row dark:border-slate-800 dark:bg-slate-900">
      <Link href={`/projects/${p.id}`} className="relative block h-32 shrink-0 overflow-hidden bg-slate-100 sm:h-auto sm:w-[200px] lg:w-[220px]" tabIndex={-1} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.coverUrl || "/img/covers/website.svg"} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        {showStatus && <span className="absolute left-3 top-3"><StatusBadge status={p.status} /></span>}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${TONE[ck]}`}>{ck === "all" ? p.category : t.cats[ck]}</span>
            <h3 className="mt-1.5 text-base font-bold leading-snug text-ink sm:text-lg dark:text-white">
              <Link href={`/projects/${p.id}`} className="text-inherit no-underline hover:text-brand-700 focus-visible:underline">{p.title}</Link>
            </h3>
          </div>
          <button type="button" onClick={() => toggle(p.id)} aria-pressed={saved} aria-label={saved ? t.card.unbookmark : t.card.bookmark}
            className={`icon-btn shrink-0 ${saved ? "!border-brand-200 !bg-brand-50 !text-brand-600" : ""}`}>
            <Bookmark className={`h-[18px] w-[18px] ${saved ? "fill-current" : ""}`} />
          </button>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">{p.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.slice(0, 4).map((s) => <span key={s} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-navy-800 dark:bg-slate-800 dark:text-slate-200">{s}</span>)}
          {skills.length > 4 && <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-500">+{skills.length - 4}</span>}
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
          <div>
            <div className="text-lg font-extrabold text-brand-600">{somoniT(p.budget)}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /><span suppressHydrationWarning>{timeAgoT(p.createdAt, t)}</span></span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.city}</span>
            </div>
          </div>
          {p.status === "OPEN" && (
            <button type="button" onClick={() => setOpen(true)} className="btn-primary w-full sm:w-auto"><Send className="h-4 w-4" />{t.card.propose}</button>
          )}
        </div>
      </div>
      {open && <ProposalModal open={open} onClose={() => setOpen(false)} project={p} />}
    </article>
  );
}
