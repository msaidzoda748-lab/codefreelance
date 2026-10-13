import { EventEmitter } from "events";

type ChatEvent =
  | { type: "message"; projectId: string; message: unknown }
  | { type: "typing"; projectId: string; userId: string; name: string; typing: boolean }
  | { type: "read"; projectId: string; userId: string; messageIds: string[] }
  | { type: "notification"; userId: string; notification: unknown };

declare global {
  // eslint-disable-next-line no-var
  var __cfRealtime: EventEmitter | undefined;
}

export const realtime: EventEmitter =
  globalThis.__cfRealtime || new EventEmitter();
realtime.setMaxListeners(100);
if (!globalThis.__cfRealtime) globalThis.__cfRealtime = realtime;

export function emitChat(event: ChatEvent) {
  realtime.emit(`chat:${event.projectId}`, event);
  if (event.type === "message") {
    realtime.emit("chat:any", event);
  }
}

export function emitNotification(userId: string, notification: unknown) {
  const event: ChatEvent = { type: "notification", userId, notification };
  realtime.emit(`notify:${userId}`, event);
}

export function onProject(
  projectId: string,
  handler: (e: ChatEvent) => void
) {
  const key = `chat:${projectId}`;
  realtime.on(key, handler);
  return () => realtime.off(key, handler);
}

export function onNotify(userId: string, handler: (e: ChatEvent) => void) {
  const key = `notify:${userId}`;
  realtime.on(key, handler);
  return () => realtime.off(key, handler);
}
