import { prisma } from "./prisma";
import { emitNotification } from "./realtime";

export async function notifyUser(opts: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  const n = await prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      link: opts.link,
    },
  });
  emitNotification(opts.userId, n);
  return n;
}
