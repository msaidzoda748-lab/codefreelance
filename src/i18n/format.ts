import type { Dict } from ".";
export function fmt(s: string, vars: Record<string, string | number> = {}) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
export function errorText(t: Dict, code?: string | null) {
  if (!code) return t.errors.server;
  return (t.errors as Record<string, string>)[code] ?? code;
}
export function fieldText(t: Dict, code?: string | null) {
  if (!code) return "";
  return (t.v as Record<string, string>)[code] ?? code;
}
const LOCALE = { tj: "ru-RU", ru: "ru-RU", en: "en-GB" } as const;
const MONTHS_TJ = ["январ", "феврал", "март", "апрел", "май", "июн", "июл", "август", "сентябр", "октябр", "ноябр", "декабр"];
/** Deterministic date formatting (same on server and client). */
export function fdate(d: Date | string | null | undefined, lang: string) {
  if (!d) return "—";
  const x = typeof d === "string" ? new Date(d) : d;
  if (lang === "tj") return `${x.getUTCDate()} ${MONTHS_TJ[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
  return x.toLocaleDateString(LOCALE[lang as keyof typeof LOCALE] || "ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
export function fdatetime(d: Date | string, lang: string) {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${fdate(x, lang)}, ${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`;
}
export function money(n: number, t: Dict) {
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${t.common.somoni}`;
}
export function moneyRange(p: { budget: number; budgetMin?: number | null; budgetMax?: number | null }, t: Dict) {
  return p.budgetMin != null && p.budgetMax != null && p.budgetMin !== p.budgetMax ? `${money(p.budgetMin, t).replace(` ${t.common.somoni}`, "")}–${money(p.budgetMax, t)}` : money(p.budget, t);
}
