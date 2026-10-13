"use client";
/** Browser fetch helper: never throws; returns a uniform result. */
export type ApiResult<T = Record<string, unknown>> = { ok: true; data: T } | { ok: false; error: string; fields?: Record<string, string>; status: number };

export async function api<T = Record<string, unknown>>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<ApiResult<T>> {
  const { json, ...rest } = init;
  try {
    const res = await fetch(url, {
      ...rest,
      headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers || {}) } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) return { ok: false, error: data.error || (res.status >= 500 ? "server" : "invalid"), fields: data.fields, status: res.status };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "network", status: 0 };
  }
}
