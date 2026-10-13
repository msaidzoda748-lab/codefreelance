import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-md text-sm text-slate-500">Платформаи боэътимод барои фрилансерҳо ва мизоҷон дар Тоҷикистон.</p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-navy-900 dark:text-white">Платформа</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/projects" className="text-slate-500 hover:text-brand-600">Лоиҳаҳо</Link></li>
            <li><Link href="/freelancers" className="text-slate-500 hover:text-brand-600">Фрилансерҳо</Link></li>
            <li><Link href="/#how" className="text-slate-500 hover:text-brand-600">Чӣ тавр кор мекунад</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-navy-900 dark:text-white">Тамос</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" />support@codefreelance.tj</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" />Душанбе, Тоҷикистон</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400 dark:border-slate-800">© {new Date().getFullYear()} CodeFreelance</div>
    </footer>
  );
}
