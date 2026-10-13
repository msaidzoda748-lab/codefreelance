"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";
import { TextField, FormMessage } from "@/components/ui/Field";

export default function ResetPage() {
  const { t } = useI18n();
  const [token, setToken] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [field, setField] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  useEffect(() => setToken(new URLSearchParams(window.location.search).get("token") || ""), []);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") || "");
    if (password.length < 8) return setField("min8");
    setLoading(true); setError(""); setField(undefined);
    const r = await api("/api/auth/reset", { method: "POST", json: { token, password } });
    setLoading(false);
    if (!r.ok) { setField(r.fields?.password); return setError(errorText(t, r.error)); }
    setDone(true);
  }
  return (
    <div className="mx-auto grid max-w-md animate-slide-up gap-6">
      <div className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white"><KeyRound className="h-5 w-5" aria-hidden /></span>
        <h1 className="text-2xl font-extrabold text-ink dark:text-white">{t.auth.resetTitle}</h1>
      </div>
      <form onSubmit={onSubmit} className="card space-y-4" noValidate>
        {done ? <FormMessage kind="success">{t.auth.resetDone}</FormMessage> : (
          <>
            <TextField label={t.auth.newPassword} name="password" type="password" autoComplete="new-password" error={field} hint={t.v.min8} />
            {error && <FormMessage>{error}</FormMessage>}
            <button type="submit" disabled={loading || !token} className="btn-primary w-full">{loading ? t.auth.loading : t.auth.savePassword}</button>
          </>
        )}
        <p className="text-center text-sm"><Link href="/login" className="font-semibold text-brand-700 hover:underline">{t.auth.backToLogin}</Link></p>
      </form>
    </div>
  );
}
