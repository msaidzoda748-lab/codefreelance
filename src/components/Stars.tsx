"use client";
import { Star } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt } from "@/i18n/format";

export default function Stars({ value, count }: { value: number | null; count?: number }) {
  const { t } = useI18n();
  if (value == null) return <span className="inline-flex items-center gap-1 text-sm text-slate-400"><Star className="h-3.5 w-3.5" aria-hidden />{t.rev.noReviews}</span>;
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5 text-sm" aria-label={fmt(t.rev.stars, { n: value })}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} aria-hidden className={`h-3.5 w-3.5 ${i <= full ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />)}
      <span className="ml-1.5 font-semibold text-ink dark:text-slate-200">{value}</span>
      {typeof count === "number" && <span className="text-slate-400">({count})</span>}
    </span>
  );
}
