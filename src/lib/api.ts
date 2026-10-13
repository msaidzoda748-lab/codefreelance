import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import { rateLimit, type LimitName } from "./ratelimit";

/** Error codes are translated on the client via t.errors[code]. */
export type ErrorCode =
  | "unauthorized" | "forbidden" | "not_found" | "invalid" | "rate_limited" | "server"
  | "email_taken" | "bad_credentials" | "restricted" | "token_invalid"
  | "only_client" | "only_freelancer" | "not_open" | "already_proposed" | "already_hired"
  | "bad_transition" | "not_participant" | "review_not_allowed" | "already_reviewed"
  | "file_invalid" | "self_action";

export function ok<T extends object>(data: T = {} as T, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}
export function fail(code: ErrorCode, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error: code, ...extra }, { status });
}
export class ApiError extends Error {
  constructor(public code: ErrorCode, public status = 400, public extra: Record<string, unknown> = {}) { super(code); }
}
export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(opts: { role?: "CLIENT" | "FREELANCER"; admin?: boolean } = {}) {
  const u = await getCurrentUser();
  if (!u) throw new ApiError("unauthorized", 401);
  if (opts.admin && !u.isAdmin) throw new ApiError("forbidden", 403);
  if (opts.role === "CLIENT" && u.role !== "CLIENT") throw new ApiError("only_client", 403);
  if (opts.role === "FREELANCER" && u.role !== "FREELANCER") throw new ApiError("only_freelancer", 403);
  return u;
}
export function limit(name: LimitName, key: string) {
  const r = rateLimit(name, key);
  if (!r.ok) throw new ApiError("rate_limited", 429, { retryAfter: r.retryAfter });
}
/** Wrap a route handler: converts ApiError to JSON responses, logs unexpected errors. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try { return await fn(...args); }
    catch (e) {
      if (e instanceof ApiError) return fail(e.code, e.status, e.extra);
      console.error(e);
      return fail("server", 500);
    }
  };
}
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try { return (await req.json()) as Record<string, unknown>; } catch { throw new ApiError("invalid", 400); }
}
export const str = (v: unknown, max = 5000) => String(v ?? "").trim().slice(0, max);
export const int = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? Math.round(n) : NaN; };
