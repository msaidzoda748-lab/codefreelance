"use client";
import { Bookmark } from "lucide-react";
import { useBookmarks } from "@/lib/bookmarks";
import { useI18n } from "@/i18n/I18nProvider";

export default function BookmarkButton({ id }: { id: string }) {
  const { t } = useI18n();
  const { has, toggle } = useBookmarks();
  const saved = has(id);
  return (
    <button type="button" onClick={() => toggle(id)} aria-pressed={saved} aria-label={saved ? t.card.unbookmark : t.card.bookmark}
      className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${saved ? "border-brand-200 bg-brand-50 text-brand-600" : "border-line text-slate-400 hover:text-brand-600"}`}>
      <Bookmark className={`h-[18px] w-[18px] ${saved ? "fill-current" : ""}`} aria-hidden />
    </button>
  );
}
