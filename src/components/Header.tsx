import Link from "next/link";
import {
  Briefcase,
  LogOut,
  PlusCircle,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2 no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white shadow-soft transition group-hover:shadow-glow">
              <Briefcase className="h-4 w-4" />
            </span>
            <span className="bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-lg font-extrabold tracking-tight text-transparent dark:from-brand-300 dark:to-accent-400">
              CodeFreelance
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/projects" className="link-nav flex items-center gap-1.5 rounded-lg px-3 py-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80">
              <Search className="h-3.5 w-3.5 opacity-70" />
              Лоиҳаҳо
            </Link>
            <Link href="/freelancers" className="link-nav flex items-center gap-1.5 rounded-lg px-3 py-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80">
              <Users className="h-3.5 w-3.5 opacity-70" />
              Фрилансерҳо
            </Link>
            {user?.role === "CLIENT" && (
              <Link href="/projects/new" className="link-nav flex items-center gap-1.5 rounded-lg px-3 py-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80">
                <PlusCircle className="h-3.5 w-3.5 opacity-70" />
                Эълони лоиҳа
              </Link>
            )}
            {user?.role === "FREELANCER" && (
              <Link href="/profile" className="link-nav flex items-center gap-1.5 rounded-lg px-3 py-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/80">
                <UserRound className="h-3.5 w-3.5 opacity-70" />
                Профили ман
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && <NotificationBell />}
          {user ? (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {user.role === "CLIENT" ? "Мизоҷ" : "Фрилансер"}
                  </div>
                </div>
              </div>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="btn-secondary !px-3">
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Баромадан</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary no-underline !px-3">
                Вуруд
              </Link>
              <Link href="/register" className="btn-primary no-underline !px-3">
                Сабти ном
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
