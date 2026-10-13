"use client";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { SITE } from "@/config/site";
import { useI18n } from "@/i18n/I18nProvider";
import Logo from "./Logo";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-12 border-t border-line bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-md text-sm text-ink-muted">{t.footer.tagline}</p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink dark:text-white">{t.footer.platform}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/projects" className="text-ink-muted hover:text-brand-600">{t.nav.projects}</Link></li>
            <li><Link href="/freelancers" className="text-ink-muted hover:text-brand-600">{t.nav.freelancers}</Link></li>
            <li><Link href="/#how" className="text-ink-muted hover:text-brand-600">{t.nav.how}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink dark:text-white">{t.footer.contact}</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" aria-hidden />{SITE.supportEmail}</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden />{SITE.city}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-slate-400 dark:border-slate-800">© {new Date().getFullYear()} {SITE.name}</div>
    </footer>
  );
}
