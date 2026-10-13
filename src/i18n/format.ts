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
/** Render a stored notification in the viewer's language (type + JSON params; falls back to legacy title/body). */
export function notifText(t: Dict, n: { type: string; title: string; body: string }) {
  const tpl = (t.notif as Record<string, string>)[n.type];
  if (tpl && n.body.startsWith("{")) { try { return fmt(tpl, JSON.parse(n.body)); } catch { /* legacy */ } }
  return n.body ? `${n.title}: ${n.body}` : n.title;
}
export function relTime(d: Date | string, lang: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(lang === "en" ? "en" : "ru", { numeric: "auto" });
  if (s < 60) return rtf.format(-s, "second");
  if (s < 3600) return rtf.format(-Math.floor(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.floor(s / 3600), "hour");
  return rtf.format(-Math.floor(s / 86400), "day");
}
