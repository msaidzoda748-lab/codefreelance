"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, CheckCheck, Clock, Paperclip, RotateCw, Send } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { fdatetime, fmt } from "@/i18n/format";
import { api } from "@/lib/client";
import FileUploader, { AttachmentList, type UploadedFile } from "./ui/FileUploader";
import Avatar from "./Avatar";
import { SkeletonList } from "./ui/States";

type Att = { id: string; name: string; mimeType: string; size: number; url: string };
type Msg = { id: string; body: string; hidden?: boolean; createdAt: string; senderId: string; clientMessageId: string | null; sender: { id: string; name: string; avatarUrl: string | null }; attachments: Att[]; state?: "sending" | "failed" };
type Page = { messages: Msg[]; hasMore: boolean; othersReadAt: string | null };
const cid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** Conversation view: pagination (older), optimistic send with clientMessageId (safe retry), read receipts, typing, SSE. */
export default function ChatBox({ conversationId, me, other }: { conversationId: string; me: { id: string; name: string; avatarUrl: string | null }; other: { id: string; name: string } | null }) {
  const { t, lang } = useI18n();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [readAt, setReadAt] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showFiles, setShowFiles] = useState(false);
  const [typing, setTyping] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const typingSent = useRef(0);

  const merge = useCallback((incoming: Msg[]) => setMsgs((cur) => {
    const out = [...cur];
    for (const m of incoming) {
      const i = out.findIndex((x) => x.id === m.id || (m.clientMessageId && x.clientMessageId === m.clientMessageId && x.senderId === m.senderId));
      if (i >= 0) out[i] = m; else out.push(m);
    }
    return out.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }), []);
  const markRead = useCallback(() => { api(`/api/conversations/${conversationId}/read`, { method: "POST" }); }, [conversationId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await api<Page>(`/api/conversations/${conversationId}/messages`);
      if (!alive) return;
      setLoading(false);
      if (!r.ok) return setLoadErr(true);
      setMsgs(r.data.messages); setHasMore(r.data.hasMore); setReadAt(r.data.othersReadAt);
      markRead();
    })();
    const es = new EventSource(`/api/conversations/${conversationId}/stream`);
    let tmo: ReturnType<typeof setTimeout>;
    es.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        if (d.type === "message") { merge([d.message]); if (d.message.senderId !== me.id) markRead(); }
        if (d.type === "read" && d.userId !== me.id) setReadAt(d.at);
        if (d.type === "typing" && d.userId !== me.id) { setTyping(d.typing ? d.name : ""); clearTimeout(tmo); tmo = setTimeout(() => setTyping(""), 5000); }
      } catch { /* ignore */ }
    };
    return () => { alive = false; es.close(); clearTimeout(tmo); };
  }, [conversationId, me.id, merge, markRead]);

  useEffect(() => { const el = listRef.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [msgs, typing]);

  async function older() {
    const first = msgs.find((m) => !m.state);
    if (!first) return;
    const el = listRef.current; const h = el?.scrollHeight || 0;
    stick.current = false;
    const r = await api<Page>(`/api/conversations/${conversationId}/messages?before=${first.id}`);
    if (!r.ok) return;
    setHasMore(r.data.hasMore); merge(r.data.messages);
    requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - h; });
  }
  async function deliver(m: Msg, attachmentIds: string[]) {
    const r = await api<{ message: Msg }>(`/api/conversations/${conversationId}/messages`, { method: "POST", json: { body: m.body, clientMessageId: m.clientMessageId, attachmentIds } });
    if (r.ok) merge([r.data.message]);
    else setMsgs((cur) => cur.map((x) => (x.clientMessageId === m.clientMessageId ? { ...x, state: "failed" as const } : x)));
  }
  const pendingAtt = useRef(new Map<string, string[]>());
  function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = text.trim();
    if (!body && !files.length) return;
    const c = cid();
    const m: Msg = { id: `tmp-${c}`, body, createdAt: new Date().toISOString(), senderId: me.id, clientMessageId: c, sender: { ...me }, attachments: files.map((f) => ({ ...f })), state: "sending" };
    const ids = files.map((f) => f.id);
    pendingAtt.current.set(c, ids);
    stick.current = true;
    setMsgs((cur) => [...cur, m]); setText(""); setFiles([]); setShowFiles(false);
    deliver(m, ids);
    api(`/api/conversations/${conversationId}/typing`, { method: "POST", json: { typing: false } });
  }
  function retry(m: Msg) {
    setMsgs((cur) => cur.map((x) => (x.clientMessageId === m.clientMessageId ? { ...x, state: "sending" as const } : x)));
    deliver(m, pendingAtt.current.get(m.clientMessageId!) || []); // same clientMessageId → server dedupes
  }
  function onType(v: string) {
    setText(v);
    if (Date.now() - typingSent.current > 3000) { typingSent.current = Date.now(); api(`/api/conversations/${conversationId}/typing`, { method: "POST", json: { typing: true } }); }
  }
  const lastMine = [...msgs].reverse().find((m) => m.senderId === me.id && !m.state);

  return (
    <div className="flex h-[calc(100dvh-12.5rem)] min-h-[260px] md:h-[calc(100dvh-15rem)] flex-col overflow-hidden rounded-card border border-line bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 lg:h-[calc(100dvh-12rem)]">
      <div ref={listRef} onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}
        className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,.05)_1px,transparent_0)] [background-size:18px_18px] p-3 sm:p-5 dark:bg-slate-950/40" role="log" aria-live="polite" aria-label={t.chat.title} data-testid="chat-log">
        {hasMore && <div className="text-center"><button type="button" onClick={older} className="btn-ghost text-xs" data-testid="older">{t.chat.older}</button></div>}
        {loading && <div className="p-2"><SkeletonList rows={4} label={t.common.loading} /></div>}
        {loadErr && <p role="alert" className="py-8 text-center text-sm text-rose-600">{t.common.error}</p>}
        {!loading && !loadErr && !msgs.length && <p className="py-12 text-center text-sm text-ink-muted">{t.chat.noMessages}</p>}
        {msgs.map((m) => {
          const mine = m.senderId === me.id;
          const read = mine && !m.state && readAt && new Date(readAt) >= new Date(m.createdAt);
          return (
            <div key={m.clientMessageId || m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : ""}`} data-testid="msg">
              {!mine && <Avatar name={m.sender.name} src={m.sender.avatarUrl} size="sm" />}
              <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[70%] ${mine ? "rounded-br-md bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,.7)]" : "rounded-bl-md bg-white text-ink ring-1 ring-line dark:bg-slate-800 dark:ring-slate-700"}`}>
                {m.hidden ? <em className="opacity-70">{t.chat.hidden}</em> : <>
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                  {m.attachments.length > 0 && <div className="mt-2 [&_a]:bg-white/90"><AttachmentList files={m.attachments} /></div>}
                </>}
                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-white/75" : "text-slate-400"}`}>
                  <span>{fdatetime(m.createdAt, lang)}</span>
                  {m.state === "sending" && <Clock className="h-3 w-3" aria-label={t.chat.sending} />}
                  {mine && !m.state && (read ? <CheckCheck className="h-3.5 w-3.5" aria-label={t.chat.read} /> : <Check className="h-3.5 w-3.5" aria-label={t.chat.delivered} />)}
                </div>
                {m.state === "failed" && <button type="button" onClick={() => retry(m)} className="mt-1 inline-flex min-h-[44px] sm:min-h-[32px] items-center gap-1 rounded-lg bg-rose-500 px-2 text-xs font-semibold text-white" data-testid="retry"><AlertCircle className="h-3.5 w-3.5" aria-hidden />{t.chat.failed}<RotateCw className="h-3 w-3" aria-hidden /></button>}
              </div>
            </div>
          );
        })}
        {lastMine && readAt && new Date(readAt) >= new Date(lastMine.createdAt) && <p className="text-right text-[11px] text-ink-muted">{t.chat.read}</p>}
        {typing && <p className="text-xs italic text-ink-muted">{fmt(t.chat.typing, { name: typing })}</p>}
      </div>
      <form onSubmit={send} className="border-t border-line bg-white/90 p-2 backdrop-blur sm:p-3 dark:border-slate-800 dark:bg-slate-900/90">
        {showFiles && <div className="mb-2"><FileUploader kind="chat" files={files} onChange={setFiles} /></div>}
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-slate-50 p-1.5 transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800">
          <button type="button" onClick={() => setShowFiles((v) => !v)} aria-expanded={showFiles} aria-label={t.chat.attach} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><Paperclip className="h-5 w-5" aria-hidden /></button>
          <label htmlFor="chat-input" className="sr-only">{t.chat.placeholder}</label>
          <textarea id="chat-input" rows={1} value={text} onChange={(e) => onType(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={other ? `${t.chat.placeholder}` : t.chat.placeholder} maxLength={5000} className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-ink outline-none placeholder:text-slate-400 dark:text-white" data-testid="chat-input" />
          <button type="submit" className="btn-primary h-11 w-11 shrink-0 !rounded-xl !p-0" aria-label={t.chat.send} disabled={!text.trim() && !files.length} data-testid="chat-send"><Send className="h-4 w-4" aria-hidden /></button>
        </div>
      </form>
    </div>
  );
}
