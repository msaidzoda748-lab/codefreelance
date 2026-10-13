"use client";
import Link from "next/link";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";
import { TextField, FormMessage } from "@/components/ui/Field";

export default function ForgotPage() {
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "loading" | "sent" | "nomail">("idle");
  const [error, setError] = useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading"); setError("");
    const r = await api<{ emailConfigured: boolean }>("/api/auth/forgot", { method: "POST", json: { email: new FormData(e.currentTarget).get("email") } });
    if (!r.ok) { setState("idle"); return setError(errorText(t, r.error)); }
    setState(r.data.emailConfigured ? "sent" : "nomail");
  }
  return (
    <div className="mx-auto grid max-w-md animate-slide-up gap-6">
      <div className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white"><KeyRound className="h-5 w-5" aria-hidden /></span>
        <h1 className="text-2xl font-extrabold text-ink dark:text-white">{t.auth.forgotTitle}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.auth.forgotSub}</p>
      </div>
      <form onSubmit={onSubmit} className="card space-y-4">
        {state === "sent" ? <FormMessage kind="success">{t.auth.forgotSent}</FormMessage> : state === "nomail" ? <FormMessage kind="info">{t.auth.forgotNoMail}</FormMessage> : (
          <>
            <TextField label={t.auth.email} name="email" type="email" autoComplete="email" required />
            {error && <FormMessage>{error}</FormMessage>}
            <button type="submit" disabled={state === "loading"} className="btn-primary w-full">{state === "loading" ? t.auth.loading : t.auth.sendLink}</button>
          </>
        )}
        <p className="text-center text-sm"><Link href="/login" className="font-semibold text-brand-700 hover:underline">{t.auth.backToLogin}</Link></p>
      </form>
    </div>
  );
}
