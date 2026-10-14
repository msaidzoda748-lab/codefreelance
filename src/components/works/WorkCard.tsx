import { optImg } from "@/lib/img";
import Link from "next/link";
import { Eye, ImageIcon } from "lucide-react";
import type { Dict } from "@/i18n/tj";
import { fmt } from "@/i18n/format";
import Avatar from "../Avatar";
import WorkLinks, { type WorkLinkSet } from "./WorkLinks";

export type WorkCardData = WorkLinkSet & { id: string; title: string; description: string; images: string; tech: string; views: number; category?: string; author?: { id: string; name: string; avatarUrl: string | null } };

export default function WorkCard({ w, t }: { w: WorkCardData; t: Dict }) {
  const cover = w.images.split("\n").filter(Boolean)[0];
  const tech = w.tech.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <article className="group card card-hover relative flex flex-col overflow-hidden !p-0" data-testid="work-card">
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-mesh">
        {cover ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={optImg(cover, 640)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100" />
          : <div className="flex h-full items-center justify-center text-brand-400"><ImageIcon className="h-10 w-10" aria-hidden /></div>}
        {w.category && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-700 shadow-sm backdrop-blur dark:bg-slate-900/80">{w.category}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold leading-snug text-ink">
          <Link href={`/works/${w.id}`} className="no-underline after:absolute after:inset-0 hover:text-brand-700">{w.title}</Link>
        </h3>
        {w.description && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{w.description}</p>}
        {tech.length > 0 && <ul className="mt-3 flex flex-wrap gap-1.5">{tech.slice(0, 4).map((s) => <li key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{s}</li>)}{tech.length > 4 && <li className="text-[11px] text-ink-muted">+{tech.length - 4}</li>}</ul>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          {w.author ? <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-ink"><Avatar name={w.author.name} src={w.author.avatarUrl} size="sm" /><span className="truncate">{w.author.name}</span></span> : <span />}
          <span className="flex items-center gap-2">
            <WorkLinks w={w} t={t} compact />
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted" title={fmt(t.works.views, { n: w.views })}><Eye className="h-3.5 w-3.5" aria-hidden />{w.views}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
