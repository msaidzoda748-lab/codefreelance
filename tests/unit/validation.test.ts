import { describe, expect, it } from "vitest";
import { validateProject, validateProposal, validateRegister } from "@/lib/validation";
import { rateLimit, resetRateLimits } from "@/lib/ratelimit";

describe("validation", () => {
  const now = new Date("2026-10-13T10:00:00Z");
  it("register", () => {
    expect(validateRegister({ name: "A", email: "bad", password: "123", role: "X" })).toEqual({ name: "min2", email: "email", password: "min8", role: "required" });
    expect(validateRegister({ name: "Ali", email: "a@b.tj", password: "password123", role: "CLIENT" })).toEqual({});
  });
  it("project budget range and deadlines", () => {
    const base = { title: "Website", description: "x".repeat(25), category: "web", budget: 0, deadline: "2026-11-01" };
    expect(validateProject({ ...base, budgetMin: 500, budgetMax: 300 }, now).budget).toBe("range");
    expect(validateProject({ ...base, budgetMin: 300, budgetMax: 500 }, now)).toEqual({});
    expect(validateProject({ ...base, budget: 100, deadline: "2026-10-01" }, now).deadline).toBe("future");
    expect(validateProject({ ...base, budget: 100, proposalDeadline: "2026-12-01" }, now).proposalDeadline).toBe("beforeDeadline");
  });
  it("proposal", () => {
    expect(validateProposal({ price: 0, deliveryDays: 0, coverLetter: "short" })).toEqual({ price: "positive", deliveryDays: "days", coverLetter: "min20" });
  });
});
describe("rate limit", () => {
  it("blocks after max within window and recovers", () => {
    resetRateLimits();
    const t0 = 1_000_000;
    for (let i = 0; i < 8; i++) expect(rateLimit("login", "k", t0 + i).ok).toBe(true);
    expect(rateLimit("login", "k", t0 + 10).ok).toBe(false);
    expect(rateLimit("login", "k", t0 + 11 * 60_000).ok).toBe(true);
  });
});
