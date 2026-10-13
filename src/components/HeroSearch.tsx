"use client";
import { Search } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

export default function HeroSearch({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  const { t } = useI18n();
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className="flex items-center gap-2 rounded-[18px] border border-line bg-white p-1.5 shadow-soft transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900">
      <Search className="ml-2.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
      <label htmlFor="hero-q" className="sr-only">{t.hero.searchLabel}</label>
      <input id="hero-q" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={t.hero.placeholder}
        className="min-h-[44px] min-w-0 flex-1 bg-transparent px-1 text-[15px] text-ink outline-none placeholder:text-slate-400 dark:text-white" />
      <button type="submit" className="btn-primary shrink-0 !px-4 sm:!px-6">{t.hero.search}</button>
    </form>
  );
}
