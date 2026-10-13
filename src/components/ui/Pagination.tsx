"use client";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt } from "@/i18n/format";

/** Link-based pagination that preserves other query params. */
export default function Pagination({ page, pages, params, basePath }: { page: number; pages: number; params: Record<string, string | undefined>; basePath: string }) {
  const { t } = useI18n();
  if (pages <= 1) return null;
  const href = (p: number) => { const q = new URLSearchParams(); for (const [k, v] of Object.entries(params)) if (v && k !== "page") q.set(k, v); if (p > 1) q.set("page", String(p)); const s = q.toString(); return s ? `${basePath}?${s}` : basePath; };
  const cls = "inline-flex min-h-[44px] items-center gap-1 rounded-[14px] border border-line bg-white px-4 text-sm font-semibold no-underline transition hover:border-brand-300 hover:text-brand-700";
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-3">
      {page > 1 ? <Link href={href(page - 1)} className={`${cls} text-navy-800`} rel="prev"><ChevronLeft className="h-4 w-4" aria-hidden />{t.common.prev}</Link> : <span />}
      <span className="text-sm text-ink-muted" aria-current="page">{fmt(t.common.page, { n: page, total: pages })}</span>
      {page < pages ? <Link href={href(page + 1)} className={`${cls} text-navy-800`} rel="next">{t.common.next}<ChevronRight className="h-4 w-4" aria-hidden /></Link> : <span />}
    </nav>
  );
}
