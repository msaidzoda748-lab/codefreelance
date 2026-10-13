"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LANGS } from "@/config/site";
import { useI18n } from "@/i18n/I18nProvider";

const NAMES = { tj: "Тоҷикӣ", ru: "Русский", en: "English" } as const;

export default function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={`${t.nav.language}: ${NAMES[lang]}`}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] px-2.5 text-sm font-semibold text-navy-800 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-slate-200 dark:hover:bg-slate-800">
        <Globe className="h-4 w-4 text-slate-500" aria-hidden />{lang.toUpperCase()}<ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <ul role="listbox" aria-label={t.nav.language} className="absolute right-0 z-50 mt-2 w-40 animate-modal-in overflow-hidden rounded-2xl border border-line bg-white p-1 shadow-soft dark:border-slate-700 dark:bg-slate-900">
          {LANGS.map((l) => (
            <li key={l}>
              <button type="button" role="option" aria-selected={l === lang} onClick={() => { setLang(l); setOpen(false); }}
                className={`flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 text-sm transition hover:bg-brand-50 ${l === lang ? "font-semibold text-brand-700" : "text-navy-800 dark:text-slate-200"}`}>
                <span><span className="mr-2 text-xs font-bold text-slate-400">{l.toUpperCase()}</span>{NAMES[l]}</span>
                {l === lang && <Check className="h-4 w-4" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
