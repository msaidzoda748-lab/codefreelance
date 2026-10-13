import { describe, expect, it } from "vitest";
import { avgPublished, canAccessAttachment, canReview, canViewProposal, isConversationMember, isOrderParticipant, roleInOrder } from "@/lib/domain/authz";

const order = { clientId: "c", freelancerId: "f", status: "COMPLETED" };
describe("order privacy", () => {
  it("only participants", () => {
    expect(isOrderParticipant({ id: "c" }, order)).toBe(true);
    expect(isOrderParticipant({ id: "x" }, order)).toBe(false);
    expect(isOrderParticipant(null, order)).toBe(false);
    expect(roleInOrder({ id: "f" }, order)).toBe("FREELANCER");
    expect(roleInOrder({ id: "x", isAdmin: true }, order)).toBeNull();
  });
  it("proposal content only for owner and author", () => {
    expect(canViewProposal({ id: "c" }, { clientId: "c" }, { freelancerId: "f" })).toBe(true);
    expect(canViewProposal({ id: "f" }, { clientId: "c" }, { freelancerId: "f" })).toBe(true);
    expect(canViewProposal({ id: "other" }, { clientId: "c" }, { freelancerId: "f" })).toBe(false);
    expect(canViewProposal(null, { clientId: "c" }, { freelancerId: "f" })).toBe(false);
  });
  it("conversation members only", () => {
    expect(isConversationMember({ id: "a" }, [{ userId: "a" }, { userId: "b" }])).toBe(true);
    expect(isConversationMember({ id: "z" }, [{ userId: "a" }])).toBe(false);
  });
});
describe("reviews", () => {
  it("not before completion", () => {
    expect(canReview({ id: "c" }, { ...order, status: "IN_PROGRESS" }, [])).toMatchObject({ ok: false, code: "review_not_allowed" });
  });
  it("one per participant, target is the other side", () => {
    expect(canReview({ id: "c" }, order, [])).toEqual({ ok: true, toUserId: "f" });
    expect(canReview({ id: "c" }, order, [{ fromUserId: "c" }])).toMatchObject({ ok: false, code: "already_reviewed" });
    expect(canReview({ id: "x" }, order, [])).toMatchObject({ ok: false, code: "not_participant" });
  });
  it("no self review even if client = freelancer", () => {
    expect(canReview({ id: "s" }, { status: "COMPLETED", clientId: "s", freelancerId: "s" }, [])).toMatchObject({ ok: false, code: "self_action" });
  });
  it("average uses published reviews only", () => {
    expect(avgPublished([{ rating: 5 }, { rating: 1, hidden: true }])).toBe(5);
    expect(avgPublished([{ rating: 2, hidden: true }])).toBeNull();
  });
});
describe("private files", () => {
  const base = { visibility: "PRIVATE", uploaderId: "u" };
  it("public files are open", () => expect(canAccessAttachment(null, { ...base, visibility: "PUBLIC" })).toBe(true));
  it("private: anonymous denied", () => expect(canAccessAttachment(null, base)).toBe(false));
  it("private: conversation members and order participants", () => {
    expect(canAccessAttachment({ id: "m" }, { ...base, conversationMembers: ["m"] })).toBe(true);
    expect(canAccessAttachment({ id: "f" }, { ...base, order: { clientId: "c", freelancerId: "f" } })).toBe(true);
    expect(canAccessAttachment({ id: "x" }, { ...base, order: { clientId: "c", freelancerId: "f" }, conversationMembers: ["c", "f"] })).toBe(false);
  });
  it("proposal files: author + project owner", () => {
    const proposal = { freelancerId: "f", projectClientId: "c" };
    expect(canAccessAttachment({ id: "c" }, { ...base, proposal })).toBe(true);
    expect(canAccessAttachment({ id: "z" }, { ...base, proposal })).toBe(false);
  });
});
