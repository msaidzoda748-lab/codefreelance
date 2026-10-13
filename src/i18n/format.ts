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
