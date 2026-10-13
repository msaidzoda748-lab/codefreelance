"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { SITE, LANG_COOKIE } from "@/config/site";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText, fmt } from "@/i18n/format";
import { api } from "@/lib/client";
import { TextField, FormMessage } from "@/components/ui/Field";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true); setError("");
    const r = await api<{ uiLanguage: string; isAdmin: boolean }>("/api/auth/login", { method: "POST", json: { email: fd.get("email"), password: fd.get("password") } });
    setLoading(false);
    if (!r.ok) return setError(errorText(t, r.error));
    document.cookie = `${LANG_COOKIE}=${r.data.uiLanguage}; path=/; max-age=31536000; samesite=lax`;
    const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
    router.push(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    router.refresh();
  }
  return (
    <div className="mx-auto grid max-w-md animate-slide-up gap-6">
      <div className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft"><LogIn className="h-5 w-5" aria-hidden /></span>
        <h1 className="text-2xl font-extrabold text-ink dark:text-white">{fmt(t.auth.loginTitle, { name: SITE.name })}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.auth.loginSub}</p>
      </div>
      <form onSubmit={onSubmit} className="card space-y-4" noValidate>
        <TextField label={t.auth.email} name="email" type="email" autoComplete="email" required />
        <TextField label={t.auth.password} name="password" type="password" autoComplete="current-password" required />
        <div className="text-right text-sm"><Link href="/forgot-password" className="font-medium text-brand-700 hover:underline">{t.auth.forgot}</Link></div>
        {error && <FormMessage>{error}</FormMessage>}
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? t.auth.loading : t.auth.submitLogin}</button>
        <p className="text-center text-sm text-ink-muted">{t.auth.noAccount} <Link href="/register" className="font-semibold text-brand-700 hover:underline">{t.auth.submitRegister}</Link></p>
      </form>
      <div className="rounded-2xl border border-dashed border-line bg-white p-4 text-xs text-ink-muted dark:bg-slate-900">
        <p className="mb-1 font-semibold text-ink dark:text-white">{t.auth.demo}</p>
        <p>client@demo.tj · freelancer@demo.tj · designer@demo.tj · admin@demo.tj</p>
      </div>
    </div>
  );
}
