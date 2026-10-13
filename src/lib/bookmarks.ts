"use client";
import { useCallback, useEffect, useState } from "react";
const KEY = "cf-bookmarks";
const EVT = "cf:bookmarks";
function read(): string[] { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
export function useBookmarks() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setIds(read());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(EVT, sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener(EVT, sync); };
  }, []);
  const toggle = useCallback((id: string) => {
    const cur = read();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVT));
  }, []);
  return { ids, has: (id: string) => ids.includes(id), toggle };
}
