"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Plus, UserRound, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import Logo from "./Logo";
import Avatar from "./Avatar";
import LangSwitch from "./LangSwitch";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { openCreateProject } from "./CreateProjectModal";

export default function HeaderClient() {
  const { t, user } = useI18n();
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [path]);
  const links = [
    { href: "/projects", label: t.nav.projects },
    { href: "/freelancers", label: t.nav.freelancers },
    { href: "/works", label: t.nav.works },
    ...(user ? [{ href: "/dashboard", label: t.nav.dashboard }, { href: "/messages", label: t.nav.messages }] : [{ href: "/#how", label: t.nav.how }]),
    ...(user?.isAdmin ? [{ href: "/admin", label: t.nav.admin }] : []),
  ];
  const navCls = (href: string) => `whitespace-nowrap rounded-xl px-1 py-2 text-[14px] font-medium transition hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${path === href || (href.length > 2 && path.startsWith(href + "/")) ? "text-brand-700" : "text-navy-800 dark:text-slate-300"}`;
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex shrink-0 min-h-[44px] items-center rounded-xl no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400" aria-label="Home"><Logo /></Link>
          <nav className="hidden items-center gap-4 xl:flex" aria-label="Main">
            {links.map((l) => <Link key={l.href} href={l.href} className={`no-underline ${navCls(l.href)}`}>{l.label}</Link>)}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <LangSwitch />
          <div className="hidden md:block"><ThemeToggle /></div>
          {user && <NotificationBell />}
          {user ? (
            <>
              <Link href="/account" aria-label={t.nav.account} className="rounded-full p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"><Avatar name={user.name} src={user.avatarUrl} size="sm" /></Link>
              <form action="/api/auth/logout" method="POST" className="hidden md:block">
                <button type="submit" className="icon-btn !border-transparent" aria-label={t.nav.logout} title={t.nav.logout}><LogOut className="h-4 w-4" /></button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn-secondary hidden no-underline xl:inline-flex">{t.nav.login}</Link>
          )}
          <button type="button" onClick={openCreateProject} title={t.nav.post} aria-label={t.nav.post} className="btn-primary hidden whitespace-nowrap xl:inline-flex"><Plus className="h-4 w-4" aria-hidden /><span className={user ? "hidden min-[1360px]:inline" : ""}>{t.nav.post}</span></button>
          {!user && <Link href="/login" className="icon-btn !border-transparent xl:hidden" aria-label={t.nav.login}><UserRound className="h-5 w-5" /></Link>}
          <button type="button" onClick={() => setMenu((m) => !m)} className="icon-btn !border-transparent xl:hidden" aria-label={menu ? t.nav.close : t.nav.menu} aria-expanded={menu} aria-controls="mobile-menu">
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menu && (
        <div id="mobile-menu" className="animate-fade-in border-t border-line bg-white px-4 pb-4 pt-2 xl:hidden dark:border-slate-800 dark:bg-slate-950">
          <nav className="flex flex-col" aria-label="Mobile">
            {links.map((l) => <Link key={l.href} href={l.href} className={`flex min-h-[48px] items-center no-underline ${navCls(l.href)}`}>{l.label}</Link>)}
            {user && <Link href="/notifications" className={`flex min-h-[48px] items-center no-underline ${navCls("/notifications")}`}>{t.nav.notifications}</Link>}
          </nav>
          <div className="mt-2 grid gap-2">
            <button type="button" onClick={() => { setMenu(false); openCreateProject(); }} className="btn-primary w-full"><Plus className="h-4 w-4" aria-hidden />{t.nav.post}</button>
            {user ? (
              <form action="/api/auth/logout" method="POST"><button type="submit" className="btn-secondary w-full"><LogOut className="h-4 w-4" aria-hidden />{t.nav.logout}</button></form>
            ) : (
              <Link href="/login" className="btn-secondary w-full no-underline">{t.nav.login}</Link>
            )}
            <div className="flex items-center justify-between rounded-xl px-1 pt-1 text-sm text-ink-muted md:hidden"><span>{t.nav.theme}</span><ThemeToggle /></div>
          </div>
        </div>
      )}
    </header>
  );
}
