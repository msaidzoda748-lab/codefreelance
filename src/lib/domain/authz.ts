/** Pure authorization helpers (unit-tested). */
export type U = { id: string; isAdmin?: boolean } | null | undefined;

export function isOrderParticipant(user: U, order: { clientId: string; freelancerId: string }) {
  return !!user && (user.id === order.clientId || user.id === order.freelancerId);
}
export function roleInOrder(user: U, order: { clientId: string; freelancerId: string }): "CLIENT" | "FREELANCER" | null {
  if (!user) return null;
  if (user.id === order.clientId) return "CLIENT";
  if (user.id === order.freelancerId) return "FREELANCER";
  return null;
}
/** Proposal content is visible only to the project owner and the proposal author. */
export function canViewProposal(user: U, project: { clientId: string }, proposal: { freelancerId: string }) {
  return !!user && (user.id === project.clientId || user.id === proposal.freelancerId);
}
export function isConversationMember(user: U, members: { userId: string }[]) {
  return !!user && members.some((m) => m.userId === user.id);
}
export type ReviewCheck = { ok: true; toUserId: string } | { ok: false; code: "review_not_allowed" | "not_participant" | "already_reviewed" | "self_action" };
export function canReview(user: U, order: { status: string; clientId: string; freelancerId: string }, existing: { fromUserId: string }[]): ReviewCheck {
  if (!user || !isOrderParticipant(user, order)) return { ok: false, code: "not_participant" };
  if (order.status !== "COMPLETED") return { ok: false, code: "review_not_allowed" };
  if (existing.some((r) => r.fromUserId === user.id)) return { ok: false, code: "already_reviewed" };
  const toUserId = user.id === order.clientId ? order.freelancerId : order.clientId;
  if (toUserId === user.id) return { ok: false, code: "self_action" };
  return { ok: true, toUserId };
}
/** Who may download an attachment. */
export function canAccessAttachment(user: U, a: {
  visibility: string; uploaderId: string;
  conversationMembers?: string[]; proposal?: { freelancerId: string; projectClientId: string } | null; order?: { clientId: string; freelancerId: string } | null;
}) {
  if (a.visibility !== "PRIVATE") return true;
  if (!user) return false;
  if (user.isAdmin || user.id === a.uploaderId) return true;
  if (a.conversationMembers?.includes(user.id)) return true;
  if (a.proposal && (a.proposal.freelancerId === user.id || a.proposal.projectClientId === user.id)) return true;
  if (a.order && isOrderParticipant(user, a.order)) return true;
  return false;
}
export function avgPublished(reviews: { rating: number; hidden?: boolean }[]) {
  const v = reviews.filter((r) => !r.hidden);
  if (!v.length) return null;
  return Math.round((v.reduce((s, r) => s + r.rating, 0) / v.length) * 10) / 10;
}
