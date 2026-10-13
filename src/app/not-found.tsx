import Link from "next/link";
import { SearchX } from "lucide-react";
import { getDict } from "@/i18n/server";

export default function NotFound() {
  const t = getDict();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <SearchX className="h-12 w-12 text-brand-600" aria-hidden />
      <h1 className="mt-4 text-2xl font-extrabold text-ink">404</h1>
      <p className="mt-2 text-ink-muted">{t.errors.not_found}</p>
      <div className="mt-6 flex gap-2"><Link href="/" className="btn-primary no-underline">{t.bottom.home}</Link><Link href="/projects" className="btn-secondary no-underline">{t.nav.projects}</Link></div>
    </div>
  );
}
