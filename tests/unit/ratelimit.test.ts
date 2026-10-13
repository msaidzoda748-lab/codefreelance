import { describe, expect, it, beforeEach } from "vitest";
import { rateLimit, resetRateLimits, LIMITS, clientIp } from "@/lib/ratelimit";

describe("rate limiter", () => {
  beforeEach(() => resetRateLimits());
  it("blocks after max hits within the window and reports retryAfter", () => {
    const now = 1_000_000;
    for (let i = 0; i < LIMITS.login.max; i++) expect(rateLimit("login", "ip:a", now + i).ok).toBe(true);
    const r = rateLimit("login", "ip:a", now + 100);
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBeGreaterThan(0);
  });
  it("keys are independent and the window slides", () => {
    const now = 5_000_000;
    for (let i = 0; i < LIMITS.register.max; i++) rateLimit("register", "x", now);
    expect(rateLimit("register", "x", now).ok).toBe(false);
    expect(rateLimit("register", "y", now).ok).toBe(true);
    expect(rateLimit("register", "x", now + LIMITS.register.windowMs + 1).ok).toBe(true);
  });
  it("uses the proxy-appended (rightmost) forwarded IP", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "6.6.6.6, 1.2.3.4" } });
    expect(clientIp(req)).toBe("1.2.3.4");
  });
});
