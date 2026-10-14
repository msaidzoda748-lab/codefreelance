/**
 * Pure order/milestone state machine (no DB). Server routes call these to validate every transition by role.
 */
export type Role = "CLIENT" | "FREELANCER";
export type OrderStatus = "NEGOTIATION" | "IN_PROGRESS" | "IN_REVIEW" | "REVISION_REQUESTED" | "COMPLETED" | "CANCELLED";
export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "REVISION_REQUESTED" | "ACCEPTED" | "CANCELLED";
export type MilestoneAction = "start" | "submit" | "accept" | "requestRevision" | "cancel";
export type OrderAction = "start" | "cancel";

export const ACTIVE_ORDER: OrderStatus[] = ["IN_PROGRESS", "IN_REVIEW", "REVISION_REQUESTED"];

export const MILESTONE_RULES: Record<MilestoneAction, { by: Role; from: MilestoneStatus[]; to: MilestoneStatus; needsComment?: boolean }> = {
  start: { by: "FREELANCER", from: ["PENDING"], to: "IN_PROGRESS" },
  submit: { by: "FREELANCER", from: ["PENDING", "IN_PROGRESS", "REVISION_REQUESTED"], to: "SUBMITTED" },
  accept: { by: "CLIENT", from: ["SUBMITTED"], to: "ACCEPTED" },
  requestRevision: { by: "CLIENT", from: ["SUBMITTED"], to: "REVISION_REQUESTED", needsComment: true },
  cancel: { by: "CLIENT", from: ["PENDING", "IN_PROGRESS", "REVISION_REQUESTED"], to: "CANCELLED" },
};
export const ORDER_RULES: Record<OrderAction, { by: Role; from: OrderStatus[]; to: OrderStatus }> = {
  start: { by: "FREELANCER", from: ["NEGOTIATION"], to: "IN_PROGRESS" },
  cancel: { by: "CLIENT", from: ["NEGOTIATION", "IN_PROGRESS", "IN_REVIEW", "REVISION_REQUESTED"], to: "CANCELLED" },
};

export type Transition<S> = { ok: true; to: S } | { ok: false; code: "forbidden" | "bad_transition" | "invalid" };

export function milestoneTransition(action: MilestoneAction, role: Role, status: MilestoneStatus, orderStatus: OrderStatus, comment = ""): Transition<MilestoneStatus> {
  const r = MILESTONE_RULES[action];
  if (!r) return { ok: false, code: "invalid" };
  if (r.by !== role) return { ok: false, code: "forbidden" };
  if (!ACTIVE_ORDER.includes(orderStatus)) return { ok: false, code: "bad_transition" };
  if (!r.from.includes(status)) return { ok: false, code: "bad_transition" };
  if (r.needsComment && comment.trim().length < 5) return { ok: false, code: "invalid" };
  return { ok: true, to: r.to };
}

export function orderTransition(action: OrderAction, role: Role, status: OrderStatus): Transition<OrderStatus> {
  const r = ORDER_RULES[action];
  if (!r) return { ok: false, code: "invalid" };
  if (r.by !== role) return { ok: false, code: "forbidden" };
  if (!r.from.includes(status)) return { ok: false, code: "bad_transition" };
  return { ok: true, to: r.to };
}

/** Order status while work is ongoing is derived from milestones. Returns COMPLETED when all live milestones are accepted. */
export function deriveOrderStatus(current: OrderStatus, milestones: { status: MilestoneStatus }[]): OrderStatus {
  if (current === "NEGOTIATION" || current === "COMPLETED" || current === "CANCELLED") return current;
  const live = milestones.filter((m) => m.status !== "CANCELLED");
  if (live.length && live.every((m) => m.status === "ACCEPTED")) return "COMPLETED";
  if (live.some((m) => m.status === "SUBMITTED")) return "IN_REVIEW";
  if (live.some((m) => m.status === "REVISION_REQUESTED")) return "REVISION_REQUESTED";
  return "IN_PROGRESS";
}

/** Which actions a role can take on a milestone right now (for UI buttons). */
export function availableMilestoneActions(role: Role, status: MilestoneStatus, orderStatus: OrderStatus): MilestoneAction[] {
  return (Object.keys(MILESTONE_RULES) as MilestoneAction[]).filter((a) => {
    const r = MILESTONE_RULES[a];
    return r.by === role && r.from.includes(status) && ACTIVE_ORDER.includes(orderStatus);
  });
}
export function canEditMilestones(role: Role, orderStatus: OrderStatus) {
  return role === "CLIENT" && (orderStatus === "NEGOTIATION" || ACTIVE_ORDER.includes(orderStatus));
}

/** Default title of the auto-created first milestone, per language. */
export const DEFAULT_MILESTONE_TITLE: Record<string, string> = { tj: "Иҷрои лоиҳа", ru: "Выполнение проекта", en: "Project delivery" };
export function defaultMilestoneTitle(lang?: string | null) { return DEFAULT_MILESTONE_TITLE[lang || "tj"] || DEFAULT_MILESTONE_TITLE.tj; }
/** Show stored default titles in the viewer's language. */
export function localizeMilestoneTitle(title: string, lang: string) { return Object.values(DEFAULT_MILESTONE_TITLE).includes(title) ? defaultMilestoneTitle(lang) : title; }
