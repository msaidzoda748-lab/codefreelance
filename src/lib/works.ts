import { ApiError, str } from "./api";

export const WORK_LINKS = ["link", "appStoreUrl", "playUrl", "sourceUrl", "downloadUrl"] as const;
export type WorkLinkKey = (typeof WORK_LINKS)[number];
const HOSTS: Partial<Record<WorkLinkKey, RegExp>> = {
  appStoreUrl: /^(apps|itunes)\.apple\.com$/i,
  playUrl: /^play\.google\.com$/i,
};

/** Validate one external link: https only, real host, optional store-host check. Returns null when empty, "invalid"/"host" on error. */
export function checkWorkUrl(key: WorkLinkKey, raw: unknown): { value: string | null; error?: "https" | "host" } {
  const v = String(raw ?? "").trim();
  if (!v) return { value: null };
  if (v.length > 300) return { value: null, error: "https" };
  let u: URL;
  try { u = new URL(v); } catch { return { value: null, error: "https" }; }
  if (u.protocol !== "https:" || !u.hostname.includes(".") || u.username || u.password) return { value: null, error: "https" };
  const h = HOSTS[key];
  if (h && !h.test(u.hostname)) return { value: null, error: "host" };
  return { value: u.toString() };
}

export function parseTech(raw: unknown) {
  return [...new Set(String(raw ?? "").split(",").map((s) => s.trim().slice(0, 40)).filter(Boolean))].slice(0, 15).join(", ");
}

/** Parse + validate a work/showcase payload. Category is resolved by the caller (`categoryKey`). */
export function parseWork(b: Record<string, unknown>) {
  const fields: Record<string, string> = {};
  const title = str(b.title, 160);
  if (title.length < 3) fields.title = "min3";
  const description = str(b.description, 5000);
  const links = {} as Record<WorkLinkKey, string | null>;
  for (const k of WORK_LINKS) {
    const r = checkWorkUrl(k, b[k]);
    if (r.error) fields[k] = r.error;
    links[k] = r.value;
  }
  const imgs = (Array.isArray(b.images) ? b.images.map(String) : str(b.images, 4000).split("\n"))
    .map((s) => s.trim())
    .filter((s) => (s.startsWith("/") && !s.startsWith("//")) || /^https:\/\//.test(s))
    .slice(0, 8);
  if (Object.keys(fields).length) throw new ApiError("invalid", 400, { fields });
  return { title, description, tech: parseTech(b.tech), images: imgs.join("\n"), categoryKey: str(b.categoryId, 60), ...links };
}

export const workImages = (images: string) => images.split("\n").filter(Boolean);
