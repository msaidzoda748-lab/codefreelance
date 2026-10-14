import { prisma } from "../prisma";
import { ApiError } from "../api";
import { notifyUser } from "../notifications";

export type ModTarget = "USER" | "PROJECT" | "REVIEW" | "MESSAGE" | "REPORT" | "WORK";
const ACTIONS: Record<ModTarget, string[]> = {
  USER: ["restrict", "reactivate"],
  PROJECT: ["hide", "unhide"],
  REVIEW: ["hide", "unhide"],
  MESSAGE: ["hide", "unhide"],
  REPORT: ["resolve", "dismiss"],
  WORK: ["hide", "unhide"],
};

/** Every moderation action requires a reason and is written to AuditLog. */
export async function moderate(adminId: string, targetType: ModTarget, targetId: string, action: string, reason: string, opts: { hideTarget?: boolean } = {}) {
  if (!ACTIONS[targetType]?.includes(action)) throw new ApiError("invalid");
  if (reason.trim().length < 3) throw new ApiError("invalid", 400, { fields: { reason: "min5" } });
  switch (targetType) {
    case "USER": {
      if (targetId === adminId) throw new ApiError("self_action");
      const u = await prisma.user.findUnique({ where: { id: targetId } });
      if (!u) throw new ApiError("not_found", 404);
      await prisma.user.update({ where: { id: targetId }, data: action === "restrict" ? { status: "RESTRICTED", restrictedReason: reason } : { status: "ACTIVE", restrictedReason: null } });
      if (action === "restrict") await prisma.session.deleteMany({ where: { userId: targetId } });
      break;
    }
    case "PROJECT": await prisma.project.update({ where: { id: targetId }, data: { hidden: action === "hide" } }); break;
    case "REVIEW": await prisma.review.update({ where: { id: targetId }, data: { hidden: action === "hide" } }); break;
    case "WORK": await prisma.portfolioItem.update({ where: { id: targetId }, data: { hidden: action === "hide" } }); break;
    case "MESSAGE": await prisma.message.update({ where: { id: targetId }, data: { hidden: action === "hide" } }); break;
    case "REPORT": {
      const r = await prisma.report.findUnique({ where: { id: targetId } });
      if (!r) throw new ApiError("not_found", 404);
      if (r.status !== "OPEN") throw new ApiError("bad_transition", 409);
      if (action === "resolve" && opts.hideTarget) {
        const t = r.targetType as ModTarget;
        await moderate(adminId, t, r.targetId, t === "USER" ? "restrict" : "hide", `report ${r.id}: ${reason}`);
      }
      await prisma.report.update({ where: { id: r.id }, data: { status: action === "resolve" ? "RESOLVED" : "DISMISSED", resolution: reason, resolvedById: adminId, resolvedAt: new Date() } });
      await notifyUser({ userId: r.reporterId, type: "MODERATION", params: { status: action === "resolve" ? "RESOLVED" : "DISMISSED" }, link: "/notifications" });
      break;
    }
  }
  await prisma.auditLog.create({ data: { actorId: adminId, action: `${targetType.toLowerCase()}.${action}`, targetType, targetId, reason, meta: opts.hideTarget ? JSON.stringify({ hideTarget: true }) : null } });
}
