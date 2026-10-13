"use client";
import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt } from "@/i18n/format";

/** Owner-only: pick up to 3 proposals to compare. Checkboxes are rendered via CompareCheck. */
export function useCompare() { return useState<string[]>([]); }
export default function CompareList({ projectId, children }: { projectId: string; children: (sel: string[], toggle: (id: string) => void) => React.ReactNode }) {
  const { t } = useI18n();
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? s : [...s, id]));
  return (
    <div>
      {children(sel, toggle)}
      <div className={`sticky bottom-20 z-20 mt-4 flex items-center justify-between gap-3 rounded-2xl bg-navy-900 px-4 py-3 text-white shadow-soft transition lg:bottom-4 ${sel.length >= 2 ? "" : "pointer-events-none opacity-0"}`} aria-hidden={sel.length < 2}>
        <span className="text-sm">{fmt(t.pd.compare, { n: sel.length })}</span>
        <Link tabIndex={sel.length >= 2 ? 0 : -1} href={`/projects/${projectId}/compare?ids=${sel.join(",")}`} className="btn-primary no-underline" data-testid="compare-go">{t.cmp.title}</Link>
      </div>
    </div>
  );
}
