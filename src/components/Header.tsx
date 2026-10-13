import Link from "next/link";
import { Globe, ChevronDown, LogOut, PlusCircle, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import Logo from "./Logo";
import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

export default async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-12">
          <Link href="/" className="no-underline"><Logo /></Link>
          <nav className="hidden items-center gap-9 lg:flex">
            <Link href="/projects" className="link-nav">Лоиҳаҳо</Link>
            <Link href="/freelancers" className="link-nav">Фрилансерҳо</Link>
            <Link href="/#how" className="link-nav">Чӣ тавр кор мекунад</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-1.5 px-2 text-sm font-medium text-navy-800 md:inline-flex">
            <Globe className="h-4 w-4 text-slate-500" /> TJ <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </span>
          <ThemeToggle />
          {user ? (
            <>
              <NotificationBell />
              {user.role === "FREELANCER" ? (
                <Link href="/profile" className="btn-secondary hidden no-underline sm:inline-flex">
                  <UserRound className="h-4 w-4" /> Профили ман
                </Link>
              ) : (
                <Link href="/projects/new" className="btn-primary hidden no-underline sm:inline-flex">
                  <PlusCircle className="h-4 w-4" /> Ҷойгир кардани лоиҳа
                </Link>
              )}
              <Avatar name={user.name} src={user.avatarUrl} size="sm" />
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="btn-ghost !p-2.5" title="Баромадан" aria-label="Баромадан">
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary no-underline">Ворид шудан</Link>
              <Link href="/projects/new" className="btn-primary hidden no-underline sm:inline-flex">
                <PlusCircle className="h-4 w-4" /> Ҷойгир кардани лоиҳа
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
