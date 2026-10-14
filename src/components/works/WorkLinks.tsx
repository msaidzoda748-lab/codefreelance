import { Apple, Download, Github, Globe, Play } from "lucide-react";
import type { Dict } from "@/i18n/tj";

export type WorkLinkSet = { link: string | null; appStoreUrl: string | null; playUrl: string | null; sourceUrl: string | null; downloadUrl: string | null };
const DEF = [
  { k: "link", icon: Globe, cls: "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-[0_8px_18px_-10px_rgba(5,150,105,.8)] hover:from-brand-600 hover:to-brand-700" },
  { k: "appStoreUrl", icon: Apple, cls: "bg-slate-900 text-white hover:bg-black dark:bg-white dark:text-slate-900" },
  { k: "playUrl", icon: Play, cls: "bg-slate-900 text-white hover:bg-black dark:bg-white dark:text-slate-900" },
  { k: "sourceUrl", icon: Github, cls: "bg-white text-ink ring-1 ring-line hover:ring-brand-300 dark:bg-slate-800 dark:ring-slate-700" },
  { k: "downloadUrl", icon: Download, cls: "bg-white text-ink ring-1 ring-line hover:ring-brand-300 dark:bg-slate-800 dark:ring-slate-700" },
] as const;

/** External link buttons/badges for a work. Always new tab with rel=noopener noreferrer nofollow. */
export default function WorkLinks({ w, t, compact = false }: { w: WorkLinkSet; t: Dict; compact?: boolean }) {
  const items = DEF.filter((d) => w[d.k]);
  if (!items.length) return null;
  if (compact) return (
    <ul className="flex items-center gap-1.5" aria-label={t.works.links}>
      {items.map((d) => <li key={d.k} title={t.works[d.k]} className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><d.icon className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">{t.works[d.k]}</span></li>)}
    </ul>
  );
  return (
    <ul className="flex flex-wrap gap-2" aria-label={t.works.links} data-testid="work-links">
      {items.map((d) => (
        <li key={d.k}>
          <a href={w[d.k]!} target="_blank" rel="noopener noreferrer nofollow" data-testid={`wl-${d.k}`}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-[14px] px-4 text-sm font-semibold no-underline transition duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${d.cls}`}>
            <d.icon className="h-4 w-4" aria-hidden />{d.k === "link" ? t.works.openSite : t.works[d.k]}
          </a>
        </li>
      ))}
    </ul>
  );
}
