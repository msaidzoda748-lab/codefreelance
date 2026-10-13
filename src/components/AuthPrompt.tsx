"use client";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
export default function AuthPrompt({ message }: { message: string }) {
  const { t } = useI18n();
  const path = usePathname();
  return (
    <div className="text-center">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><LogIn className="h-5 w-5" /></span>
      <p className="text-sm text-ink-muted">{message}</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Link href={`/login?next=${encodeURIComponent(path || "/")}`} className="btn-primary no-underline">{t.auth.login}</Link>
        <Link href="/register" className="btn-secondary no-underline">{t.auth.register}</Link>
      </div>
    </div>
  );
}
