import Link from "next/link";
import { Briefcase, Github, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-white/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white">
              <Briefcase className="h-4 w-4" />
            </span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              CodeFreelance
            </span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Платформаи муосири фриланс барои Тоҷикистон — лоиҳаҳо, мутахассисон,
            пешниҳодҳо ва чат дар як ҷо.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Платформа
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>
              <Link href="/projects" className="hover:text-brand-600">
                Лоиҳаҳо
              </Link>
            </li>
            <li>
              <Link href="/freelancers" className="hover:text-brand-600">
                Фрилансерҳо
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-brand-600">
                Сабти ном
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Тамос
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> support@codefreelance.tj
            </li>
            <li className="flex items-center gap-2">
              <Github className="h-3.5 w-3.5" /> MVP · 2026
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200/70 py-4 text-center text-xs text-slate-400 dark:border-slate-800">
        © {new Date().getFullYear()} CodeFreelance — MVP барои Тоҷикистон
      </div>
    </footer>
  );
}
