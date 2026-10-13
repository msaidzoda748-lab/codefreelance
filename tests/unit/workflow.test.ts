import { describe, expect, it } from "vitest";
import { availableMilestoneActions, canEditMilestones, deriveOrderStatus, milestoneTransition, orderTransition } from "@/lib/domain/workflow";

describe("order transitions", () => {
  it("freelancer starts a negotiated order", () => {
    expect(orderTransition("start", "FREELANCER", "NEGOTIATION")).toEqual({ ok: true, to: "IN_PROGRESS" });
  });
  it("client cannot start, freelancer cannot cancel", () => {
    expect(orderTransition("start", "CLIENT", "NEGOTIATION")).toMatchObject({ ok: false, code: "forbidden" });
    expect(orderTransition("cancel", "FREELANCER", "IN_PROGRESS")).toMatchObject({ ok: false, code: "forbidden" });
  });
  it("completed/cancelled orders are final", () => {
    expect(orderTransition("cancel", "CLIENT", "COMPLETED")).toMatchObject({ ok: false, code: "bad_transition" });
    expect(orderTransition("start", "FREELANCER", "CANCELLED")).toMatchObject({ ok: false, code: "bad_transition" });
  });
});

describe("milestone transitions", () => {
  it("freelancer submits; client accepts", () => {
    expect(milestoneTransition("submit", "FREELANCER", "IN_PROGRESS", "IN_PROGRESS")).toEqual({ ok: true, to: "SUBMITTED" });
    expect(milestoneTransition("accept", "CLIENT", "SUBMITTED", "IN_REVIEW")).toEqual({ ok: true, to: "ACCEPTED" });
  });
  it("freelancer can never accept (complete) work", () => {
    expect(milestoneTransition("accept", "FREELANCER", "SUBMITTED", "IN_REVIEW")).toMatchObject({ ok: false, code: "forbidden" });
  });
  it("revision request needs a comment", () => {
    expect(milestoneTransition("requestRevision", "CLIENT", "SUBMITTED", "IN_REVIEW", "")).toMatchObject({ ok: false, code: "invalid" });
    expect(milestoneTransition("requestRevision", "CLIENT", "SUBMITTED", "IN_REVIEW", "Please fix the header")).toEqual({ ok: true, to: "REVISION_REQUESTED" });
  });
  it("resubmit after revision", () => {
    expect(milestoneTransition("submit", "FREELANCER", "REVISION_REQUESTED", "REVISION_REQUESTED")).toEqual({ ok: true, to: "SUBMITTED" });
  });
  it("no work actions while negotiating or after completion", () => {
    expect(milestoneTransition("submit", "FREELANCER", "PENDING", "NEGOTIATION")).toMatchObject({ ok: false, code: "bad_transition" });
    expect(milestoneTransition("accept", "CLIENT", "SUBMITTED", "COMPLETED")).toMatchObject({ ok: false, code: "bad_transition" });
  });
  it("cannot accept twice", () => {
    expect(milestoneTransition("accept", "CLIENT", "ACCEPTED", "IN_PROGRESS")).toMatchObject({ ok: false, code: "bad_transition" });
  });
  it("available actions per role", () => {
    expect(availableMilestoneActions("CLIENT", "SUBMITTED", "IN_REVIEW").sort()).toEqual(["accept", "requestRevision"]);
    expect(availableMilestoneActions("FREELANCER", "SUBMITTED", "IN_REVIEW")).toEqual([]);
    expect(canEditMilestones("FREELANCER", "IN_PROGRESS")).toBe(false);
    expect(canEditMilestones("CLIENT", "COMPLETED")).toBe(false);
  });
});

describe("derived order status", () => {
  it("in review when a milestone is submitted", () => {
    expect(deriveOrderStatus("IN_PROGRESS", [{ status: "SUBMITTED" }, { status: "PENDING" }])).toBe("IN_REVIEW");
  });
  it("revision requested", () => {
    expect(deriveOrderStatus("IN_REVIEW", [{ status: "REVISION_REQUESTED" }, { status: "ACCEPTED" }])).toBe("REVISION_REQUESTED");
  });
  it("completed only when every live milestone is accepted", () => {
    expect(deriveOrderStatus("IN_REVIEW", [{ status: "ACCEPTED" }, { status: "CANCELLED" }])).toBe("COMPLETED");
    expect(deriveOrderStatus("IN_REVIEW", [{ status: "ACCEPTED" }, { status: "IN_PROGRESS" }])).toBe("IN_PROGRESS");
    expect(deriveOrderStatus("IN_PROGRESS", [{ status: "CANCELLED" }])).toBe("IN_PROGRESS");
  });
  it("negotiation/final statuses are not overwritten", () => {
    expect(deriveOrderStatus("NEGOTIATION", [{ status: "ACCEPTED" }])).toBe("NEGOTIATION");
    expect(deriveOrderStatus("CANCELLED", [{ status: "SUBMITTED" }])).toBe("CANCELLED");
  });
});
