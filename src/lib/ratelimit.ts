/** Simple in-memory sliding-window rate limiter (single instance — fine for Render free tier). */
type Bucket = number[];
declare global { // eslint-disable-next-line no-var
  var __cfRate: Map<string, Bucket> | undefined; }
const store: Map<string, Bucket> = globalThis.__cfRate || new Map();
globalThis.__cfRate = store;

export const LIMITS = {
  login: { max: 8, windowMs: 10 * 60_000 },
  register: { max: 5, windowMs: 60 * 60_000 },
  forgot: { max: 5, windowMs: 60 * 60_000 },
  message: { max: 30, windowMs: 60_000 },
  proposal: { max: 10, windowMs: 60 * 60_000 },
  report: { max: 10, windowMs: 60 * 60_000 },
  work: { max: 30, windowMs: 60 * 60_000 },
} as const;
export type LimitName = keyof typeof LIMITS;

export function rateLimit(name: LimitName, key: string, now = Date.now()) {
  if (process.env.RATE_LIMIT_DISABLED === "1") return { ok: true, retryAfter: 0 };
  const { max, windowMs } = LIMITS[name];
  const k = `${name}:${key}`;
  const hits = (store.get(k) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    store.set(k, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  store.set(k, hits);
  return { ok: true, retryAfter: 0 };
}
export function resetRateLimits() { store.clear(); }
export function clientIp(req: Request) {
  // Rightmost entry is the one appended by our proxy (Render); leftmost values are client-controlled.
  const xff = (req.headers.get("x-forwarded-for") || "").split(",").map((s) => s.trim()).filter(Boolean);
  return xff.at(-1) || req.headers.get("x-real-ip") || "local";
}
