"use client";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt, notifText, relTime } from "@/i18n/format";
import { api } from "@/lib/client";

type N = { id: string; type: string; title: string; body: string; link: string | null; read: boolean; createdAt: string };

export default function NotificationBell() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    const r = await api<{ notifications: N[]; unread: number }>("/api/notifications");
    if (r.ok) { setItems(r.data.notifications.slice(0, 10)); setUnread(r.data.unread); }
  }, []);
  useEffect(() => {
    load();
    const es = new EventSource("/api/notifications/stream");
    es.onmessage = (ev) => { try { const d = JSON.parse(ev.data); if (d.type !== "connected") load(); } catch { /* ignore */ } };
    const iv = setInterval(load, 60000);
    return () => { es.close(); clearInterval(iv); };
  }, [load]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);
  async function markAll() { await api("/api/notifications", { method: "POST", json: { all: true } }); load(); }
  async function openItem(n: N) {
    if (!n.read) await api("/api/notifications", { method: "POST", json: { ids: [n.id] } });
    setOpen(false);
    if (n.link) router.push(n.link); else load();
  }
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="relative flex h-11 w-11 items-center justify-center rounded-xl text-navy-800 transition hover:bg-slate-100" onClick={() => { setOpen((v) => !v); load(); }}
        aria-label={fmt(t.notif.open, { n: unread })} aria-expanded={open} aria-haspopup="true" data-testid="bell">
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white" data-testid="bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-bold">{t.notif.title}</span>
            {unread > 0 && <button type="button" onClick={markAll} className="min-h-[44px] sm:min-h-[36px] text-xs font-semibold text-brand-700">{t.notif.markAll}</button>}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {!items.length && <li className="px-4 py-8 text-center text-sm text-ink-muted">{t.notif.empty}</li>}
            {items.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => openItem(n)} className={`block w-full border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${!n.read ? "bg-brand-50/60" : ""}`}>
                  <span className="line-clamp-2 block text-sm">{notifText(t, n)}</span>
                  <span className="mt-1 block text-[11px] text-slate-400">{relTime(n.createdAt, lang)}</span>
                </button>
              </li>
            ))}
          </ul>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-3 text-center text-sm font-semibold text-brand-700 no-underline">{t.notif.title}</Link>
        </div>
      )}
    </div>
  );
}
