"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Paperclip, Send } from "lucide-react";
import Avatar from "./Avatar";

type Att = {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
};

type Msg = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  readAt?: string | null;
  sender: { id: string; name: string; avatarUrl?: string | null };
  attachments?: Att[];
};

export default function ChatBox({
  projectId,
  currentUserId,
}: {
  projectId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [typingName, setTypingName] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch(`/api/messages?projectId=${projectId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
  }

  useEffect(() => {
    load();
    fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    }).catch(() => {});

    const es = new EventSource(
      `/api/messages/stream?projectId=${projectId}`
    );
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "message" && data.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          if (data.message.senderId !== currentUserId) {
            fetch("/api/messages/read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            }).catch(() => {});
          }
        }
        if (data.type === "typing" && data.userId !== currentUserId) {
          setTypingName(data.typing ? data.name : null);
        }
        if (data.type === "read") {
          setMessages((prev) =>
            prev.map((m) =>
              m.senderId === currentUserId && !m.readAt
                ? { ...m, readAt: new Date().toISOString() }
                : m
            )
          );
        }
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, [projectId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingName]);

  function onType(v: string) {
    setText(v);
    fetch("/api/messages/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, typing: true }),
    }).catch(() => {});
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, typing: false }),
      }).catch(() => {});
    }, 1200);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !file) return;
    setError("");
    setSending(true);
    const fd = new FormData();
    fd.append("projectId", projectId);
    fd.append("body", text);
    if (file) fd.append("file", file);
    const res = await fetch("/api/messages", { method: "POST", body: fd });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(data.error || "Хатогӣ");
      return;
    }
    setText("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setMessages((m) =>
      m.some((x) => x.id === data.message.id) ? m : [...m, data.message]
    );
  }

  return (
    <div className="card flex h-[60vh] flex-col overflow-hidden !p-0 shadow-soft">
      <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white p-4 dark:from-slate-900/50 dark:to-slate-950">
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
            >
              {!mine && (
                <Avatar name={m.sender.name} src={m.sender.avatarUrl} size="sm" />
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                  mine
                    ? "rounded-br-md bg-gradient-to-br from-brand-600 to-brand-600 text-white"
                    : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                }`}
              >
                {!mine && (
                  <div className="mb-0.5 text-xs font-semibold opacity-70">
                    {m.sender.name}
                  </div>
                )}
                {m.attachments?.map((a) =>
                  a.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={a.id} href={a.url} target="_blank" rel="noreferrer">
                      <img
                        src={a.url}
                        alt={a.name}
                        className="mb-2 max-h-48 rounded-xl object-cover"
                      />
                    </a>
                  ) : (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`mb-2 flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs ${
                        mine
                          ? "bg-white/15"
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {a.name}
                    </a>
                  )
                )}
                {m.body && !m.body.startsWith("📎 ") && (
                  <div className="whitespace-pre-wrap">{m.body}</div>
                )}
                {m.body.startsWith("📎 ") && !m.attachments?.length && (
                  <div className="whitespace-pre-wrap">{m.body}</div>
                )}
                <div
                  className={`mt-1 flex items-center gap-2 text-[10px] ${
                    mine ? "text-brand-100" : "text-slate-400"
                  }`}
                >
                  <span>{new Date(m.createdAt).toLocaleString("tg-TJ")}</span>
                  {mine && (
                    <span>{m.readAt ? "Хонда шуд" : "Расонида шуд"}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {typingName && (
          <div className="text-xs italic text-slate-400">
            {typingName} менависад...
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {file && (
        <div className="border-t border-slate-100 px-3 py-2 text-xs muted dark:border-slate-800">
          Файл: {file.name}{" "}
          <button
            type="button"
            className="text-rose-500"
            onClick={() => {
              setFile(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            нест кардан
          </button>
        </div>
      )}
      <form
        onSubmit={send}
        className="flex gap-2 border-t border-slate-200/80 bg-white/90 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.txt,.doc,.docx,.zip"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          className="btn-secondary !px-3"
          onClick={() => fileRef.current?.click()}
          title="Замима"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          value={text}
          onChange={(e) => onType(e.target.value)}
          className="input"
          placeholder="Паём нависед..."
        />
        <button
          type="submit"
          disabled={sending}
          className="btn-primary shrink-0 !px-4"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Фиристодан</span>
        </button>
      </form>
      {error && <p className="px-3 pb-3 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
