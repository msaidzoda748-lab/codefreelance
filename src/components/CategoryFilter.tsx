"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { HOME_CATEGORIES, type CatKey } from "@/data/categories";

export default function CategoryFilter({ value, onChange }: { value: CatKey; onChange: (k: CatKey) => void }) {
  const { t } = useI18n();
  return (
    <div role="group" aria-label={t.cats.label} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {HOME_CATEGORIES.map((c) => {
        const active = c.key === value;
        const idle = c.key === "design" ? "bg-purple-50 text-purple-700 hover:bg-purple-100" : "bg-white text-navy-800 border border-line hover:border-brand-300 hover:text-brand-700";
        return (
          <button key={c.key} type="button" aria-pressed={active} onClick={() => onChange(c.key)}
            className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-[14px] px-5 text-sm font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-[0.97] ${active ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700" : idle}`}>
            {t.cats[c.key]}
          </button>
        );
      })}
    </div>
  );
}
