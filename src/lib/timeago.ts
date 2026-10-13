import type { Dict } from "@/i18n";
export function timeAgoT(d: Date | string, t: Dict) {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return t.time.now;
  if (s < 3600) return `${Math.floor(s / 60)} ${t.time.min}`;
  if (s < 86400) return `${Math.floor(s / 3600)} ${t.time.hour}`;
  return `${Math.floor(s / 86400)} ${t.time.day}`;
}
export function somoniT(n: number) {
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")} сомонӣ`; // deterministic (no locale diff between server & browser)
}
