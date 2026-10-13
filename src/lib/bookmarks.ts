"use client";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";

const KEY = "cf-bookmarks";
const EVT = "cf:bookmarks";
function read(): string[] { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
function write(ids: string[]) { localStorage.setItem(KEY, JSON.stringify(ids)); window.dispatchEvent(new Event(EVT)); }
let serverLoaded = false;

/** Saved projects: localStorage for guests; for logged-in users synced to the server (SavedProject). */
export function useBookmarks() {
  const { user } = useI18n();
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setIds(read());
    sync();
    if (user && !serverLoaded) {
      serverLoaded = true;
      fetch("/api/saved").then((r) => r.json()).then(async (d) => {
        if (!d.ok) return;
        const local = read();
        const merged = [...new Set([...d.ids, ...local])];
        for (const id of local.filter((x: string) => !d.ids.includes(x))) await fetch("/api/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id, saved: true }) });
        write(merged);
      }).catch(() => {});
    }
    window.addEventListener("storage", sync);
    window.addEventListener(EVT, sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener(EVT, sync); };
  }, [user]);
  const toggle = useCallback((id: string) => {
    const cur = read();
    const saved = !cur.includes(id);
    write(saved ? [...cur, id] : cur.filter((x) => x !== id));
    if (user) fetch("/api/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id, saved }) }).catch(() => {});
  }, [user]);
  return { ids, has: (id: string) => ids.includes(id), toggle };
}
