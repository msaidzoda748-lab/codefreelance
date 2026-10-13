"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type N = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  type: string;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch("/api/notifications?limit=12");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.notifications);
    setUnread(data.unreadCount);
  }

  useEffect(() => {
    load();
    const es = new EventSource("/api/notifications/stream");
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "notification") {
          load();
        }
      } catch {
        /* ignore */
      }
    };
    const t = setInterval(load, 60000);
    return () => {
      es.close();
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  }

  async function openItem(n: N) {
    if (!n.read) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
    }
    setOpen(false);
    if (n.link) window.location.href = n.link;
    else load();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn-ghost relative !p-2.5"
        onClick={() => {
          setOpen((v) => !v);
          load();
        }}
        aria-label="Огоҳиҳо"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <span className="font-bold">Огоҳиҳо</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-xs font-medium text-brand-600"
              >
                Ҳамаро хондан
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm muted">
                Огоҳӣ нест
              </p>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openItem(n)}
                className={`block w-full border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 ${
                  !n.read ? "bg-brand-50/50 dark:bg-brand-950/30" : ""
                }`}
              >
                <div className="text-sm font-semibold">{n.title}</div>
                <div className="mt-0.5 line-clamp-2 text-xs muted">{n.body}</div>
                <div className="mt-1 text-[10px] text-slate-400">
                  {new Date(n.createdAt).toLocaleString("tg-TJ")}
                </div>
              </button>
            ))}
          </div>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-brand-600 no-underline dark:border-slate-800"
          >
            Ҳама огоҳиҳо
          </Link>
        </div>
      )}
    </div>
  );
}
