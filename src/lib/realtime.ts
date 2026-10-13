import { EventEmitter } from "events";

/** In-process pub/sub for SSE (single Render instance). */
declare global {
  // eslint-disable-next-line no-var
  var __cfRealtime: EventEmitter | undefined;
}
export const realtime: EventEmitter = globalThis.__cfRealtime || new EventEmitter();
realtime.setMaxListeners(500);
if (!globalThis.__cfRealtime) globalThis.__cfRealtime = realtime;

export type ConvEvent =
  | { type: "message"; conversationId: string; message: unknown }
  | { type: "typing"; conversationId: string; userId: string; name: string; typing: boolean }
  | { type: "read"; conversationId: string; userId: string; at: string };

export function emitConv(e: ConvEvent) { realtime.emit(`conv:${e.conversationId}`, e); }
export function onConv(id: string, h: (e: ConvEvent) => void) { const k = `conv:${id}`; realtime.on(k, h); return () => { realtime.off(k, h); }; }
export function emitNotification(userId: string, notification: unknown) { realtime.emit(`notify:${userId}`, { type: "notification", userId, notification }); }
export function onNotify(userId: string, h: (e: unknown) => void) { const k = `notify:${userId}`; realtime.on(k, h); return () => { realtime.off(k, h); }; }

/** Build an SSE Response from a subscribe function. */
export function sseResponse(subscribe: (send: (d: unknown) => void) => () => void) {
  const enc = new TextEncoder();
  let cleanup: (() => void) | undefined; let hb: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream({
    start(c) {
      const send = (d: unknown) => { try { c.enqueue(enc.encode(`data: ${JSON.stringify(d)}\n\n`)); } catch { /* closed */ } };
      send({ type: "connected" });
      cleanup = subscribe(send);
      hb = setInterval(() => { try { c.enqueue(enc.encode(": ping\n\n")); } catch { /* closed */ } }, 25000);
    },
    cancel() { cleanup?.(); if (hb) clearInterval(hb); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}
