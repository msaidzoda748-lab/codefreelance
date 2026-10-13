"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

type N = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  type: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/notifications?limit=50");
    if (res.ok) {
      const data = await res.json();
      setItems(data.notifications);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  }

  return (
    <div className="mx-auto max-w-2xl animate-slide-up">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Bell className="h-7 w-7 text-brand-600" />
            Огоҳиҳо
          </h1>
          <p className="mt-1 text-sm muted">Ҳама огоҳиҳои шумо</p>
        </div>
        <button type="button" onClick={markAll} className="btn-secondary">
          Ҳамаро хондан
        </button>
      </div>
      {loading && <p className="muted">Боргирӣ...</p>}
      <div className="space-y-2">
        {items.map((n) => (
          <Link
            key={n.id}
            href={n.link || "#"}
            onClick={async () => {
              if (!n.read) {
                await fetch("/api/notifications", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: n.id }),
                });
              }
            }}
            className={`card block no-underline text-inherit ${
              !n.read ? "border-brand-200 bg-brand-50/40 dark:border-brand-800" : ""
            }`}
          >
            <div className="font-semibold">{n.title}</div>
            <p className="mt-1 text-sm muted">{n.body}</p>
            <div className="mt-2 text-xs text-slate-400">
              {new Date(n.createdAt).toLocaleString("tg-TJ")} · {n.type}
            </div>
          </Link>
        ))}
        {!loading && !items.length && (
          <div className="card py-12 text-center muted">Огоҳӣ нест</div>
        )}
      </div>
    </div>
  );
}
