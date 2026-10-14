"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Home, MessageCircle, UserRound } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

export default function BottomNavigation() {
  const { t, user } = useI18n();
  const path = usePathname() || "/";
  const items = [
    { href: "/", label: t.bottom.home, icon: Home, active: path === "/" },
    { href: "/projects", label: t.bottom.projects, icon: Briefcase, active: path.startsWith("/projects") },
    { href: user ? "/messages" : "/login?next=/messages", label: t.bottom.messages, icon: MessageCircle, active: path.startsWith("/messages") },
    { href: user ? "/dashboard" : "/login?next=/dashboard", label: t.bottom.profile, icon: UserRound, active: ["/dashboard", "/profile", "/account", "/orders", "/login"].some((x) => path.startsWith(x)) },
  ];
  return (
    <nav aria-label="Bottom" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/90 shadow-[0_-8px_24px_-12px_rgba(15,23,42,.15)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden dark:border-slate-800 dark:bg-slate-950/95">
      <ul className="mx-auto grid h-[64px] max-w-md grid-cols-4">
        {items.map((it) => (
          <li key={it.label}>
            <Link href={it.href} aria-current={it.active ? "page" : undefined}
              className={`flex h-full min-h-[44px] flex-col items-center justify-center gap-1 text-[11px] font-semibold no-underline transition active:scale-95 ${it.active ? "text-brand-600" : "text-slate-500 hover:text-navy-800"}`}>
              <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200 ${it.active ? "bg-brand-600 text-white shadow-[0_6px_14px_-6px_rgba(5,150,105,.7)]" : ""}`}><it.icon className="h-5 w-5" aria-hidden /></span>
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
