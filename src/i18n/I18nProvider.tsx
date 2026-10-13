"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, type Lang } from "@/config/site";
import { dictionaries, type Dict } from ".";

export type SessionUser = { id: string; name: string; role: "CLIENT" | "FREELANCER"; avatarUrl: string | null } | null;
type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void; user: SessionUser };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ lang: initial, user, children }: { lang: Lang; user: SessionUser; children: React.ReactNode }) {
  const [lang, setL] = useState<Lang>(initial);
  const router = useRouter();
  const setLang = useCallback((l: Lang) => {
    setL(l);
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    try { localStorage.setItem(LANG_COOKIE, l); } catch {}
    document.documentElement.lang = l === "tj" ? "tg" : l;
    router.refresh();
  }, [router]);
  return <I18nCtx.Provider value={{ lang, t: dictionaries[lang], setLang, user }}>{children}</I18nCtx.Provider>;
}
export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
