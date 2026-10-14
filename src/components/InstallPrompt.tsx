"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { PWA_DISMISS_KEY, dismissedRecently, isIosSafari, shouldRegisterSW } from "@/lib/pwa";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function InstallPrompt() {
  const { t } = useI18n();
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (shouldRegisterSW(process.env.NODE_ENV, "serviceWorker" in navigator)) {
      const reg = () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
      if (document.readyState === "complete") reg(); else window.addEventListener("load", reg, { once: true });
    }
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    let dismissed = false;
    try { dismissed = dismissedRecently(localStorage.getItem(PWA_DISMISS_KEY)); } catch {}
    if (standalone || dismissed) return;
    const onBip = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    const onInstalled = () => setEvt(null);
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    if (isIosSafari(navigator.userAgent)) setIos(true);
    return () => { window.removeEventListener("beforeinstallprompt", onBip); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const dismiss = () => { try { localStorage.setItem(PWA_DISMISS_KEY, String(Date.now())); } catch {} setEvt(null); setIos(false); };
  const install = async () => { if (!evt) return; await evt.prompt(); await evt.userChoice.catch(() => null); dismiss(); };

  if (!evt && !ios) return null;
  return (
    <div role="dialog" aria-label={t.pwa.title} className="fixed inset-x-3 bottom-20 z-[150] mx-auto max-w-md rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900 md:bottom-4 md:right-4 md:left-auto">
      <div className="flex items-start gap-3">
        <img src="/icons/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-white">{t.pwa.title}</p>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{ios ? t.pwa.iosText : t.pwa.text}</p>
          <div className="mt-3 flex gap-2">
            {evt && <button onClick={install} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"><Download size={16} />{t.pwa.install}</button>}
            <button onClick={dismiss} className="min-h-[44px] rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{ios ? t.pwa.ok : t.pwa.later}</button>
          </div>
        </div>
        <button onClick={dismiss} aria-label={t.nav.close} className="-m-2 grid h-11 w-11 place-items-center rounded-xl text-slate-400 hover:text-slate-600"><X size={18} /></button>
      </div>
    </div>
  );
}
