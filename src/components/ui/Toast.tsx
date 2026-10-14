"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

type T = { id: number; text: string; kind: "success" | "error" };
const EVT = "zf:toast";
/** Fire-and-forget toast from anywhere on the client. */
export function toast(text: string, kind: T["kind"] = "success") { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT, { detail: { text, kind } })); }

export default function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail; const id = Date.now() + Math.random();
      setItems((x) => [...x.slice(-2), { id, ...d }]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3200);
    };
    window.addEventListener(EVT, on); return () => window.removeEventListener(EVT, on);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[120] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6">
      {items.map((t) => (
        <div key={t.id} role="status" className={`pointer-events-auto flex max-w-sm animate-toast-in items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium shadow-lift ring-1 ${t.kind === "success" ? "bg-navy-900 text-white ring-white/10" : "bg-rose-600 text-white ring-rose-500"}`}>
          {t.kind === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-300" aria-hidden /> : <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />}{t.text}
        </div>
      ))}
    </div>
  );
}
