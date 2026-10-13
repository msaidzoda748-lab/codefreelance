import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { emitNotification } from "./realtime";

export type NotifType =
  | "NEW_PROPOSAL" | "PROPOSAL_ACCEPTED" | "PROPOSAL_REJECTED" | "NEW_MESSAGE" | "WORK_SUBMITTED"
  | "REVISION_REQUESTED" | "MILESTONE_ACCEPTED" | "ORDER_COMPLETED" | "ORDER_CANCELLED" | "ORDER_STARTED"
  | "DEADLINE_SOON" | "NEW_REVIEW" | "INVITED" | "MODERATION";

/**
 * Stores type + JSON params; the UI renders the text in the viewer's language (t.notif[type]).
 * `title` keeps a Tajik fallback for old clients. `dedupeKey` makes the call idempotent.
 */
export async function notifyUser(opts: { userId: string; type: NotifType | string; params?: Record<string, string | number>; title?: string; body?: string; link?: string; dedupeKey?: string }) {
  try {
    const n = await prisma.notification.create({
      data: {
        userId: opts.userId, type: opts.type, link: opts.link, dedupeKey: opts.dedupeKey,
        title: opts.title ?? opts.type,
        body: opts.params ? JSON.stringify(opts.params) : opts.body ?? "",
      },
    });
    emitNotification(opts.userId, n);
    return n;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return null; // duplicate → already notified
    throw e;
  }
}
