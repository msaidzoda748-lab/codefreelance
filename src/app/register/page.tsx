"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Briefcase, UserPlus, Code2 } from "lucide-react";
import { SITE, LANGS, LANG_COOKIE } from "@/config/site";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText, fmt } from "@/i18n/format";
import { api } from "@/lib/client";
import { validateRegister } from "@/lib/validation";
import { TextField, SelectField, FormMessage } from "@/components/ui/Field";
import { CITIES } from "@/data/cities";

const LANG_NAMES = { tj: "Тоҷикӣ", ru: "Русский", en: "English" } as const;

export default function RegisterPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [role, setRole] = useState<"CLIENT" | "FREELANCER">("CLIENT");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = { name: String(fd.get("name") || ""), email: String(fd.get("email") || "").trim(), password: String(fd.get("password") || ""), city: String(fd.get("city") || ""), uiLanguage: String(fd.get("uiLanguage") || lang), role };
    const fe = validateRegister(input);
    setFields(fe); setError("");
    if (Object.keys(fe).length) return;
    setLoading(true);
    const r = await api<{ uiLanguage: string }>("/api/auth/register", { method: "POST", json: input });
    setLoading(false);
    if (!r.ok) { setFields(r.fields || {}); return setError(errorText(t, r.error)); }
    document.cookie = `${LANG_COOKIE}=${r.data.uiLanguage}; path=/; max-age=31536000; samesite=lax`;
    router.push(role === "FREELANCER" ? "/profile" : "/dashboard");
    router.refresh();
  }
  const RoleBtn = ({ v, icon: Icon, title, hint }: { v: "CLIENT" | "FREELANCER"; icon: typeof Briefcase; title: string; hint: string }) => (
    <button type="button" role="radio" aria-checked={role === v} onClick={() => setRole(v)}
      className={`flex min-h-[64px] items-center gap-3 rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${role === v ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-line bg-white hover:border-brand-300"}`}>
      <Icon className={`h-5 w-5 shrink-0 ${role === v ? "text-brand-600" : "text-slate-400"}`} aria-hidden />
      <span><span className="block text-sm font-bold text-ink">{title}</span><span className="block text-xs text-ink-muted">{hint}</span></span>
    </button>
  );
  return (
    <div className="mx-auto grid max-w-lg animate-slide-up gap-6">
      <div className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft"><UserPlus className="h-5 w-5" aria-hidden /></span>
        <h1 className="text-2xl font-extrabold text-ink dark:text-white">{fmt(t.auth.registerTitle, { name: SITE.name })}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.auth.registerSub}</p>
      </div>
      <form onSubmit={onSubmit} className="card space-y-4" noValidate>
        <fieldset>
          <legend className="label">{t.auth.iAm}</legend>
          <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
            <RoleBtn v="CLIENT" icon={Briefcase} title={t.auth.client} hint={t.auth.clientHint} />
            <RoleBtn v="FREELANCER" icon={Code2} title={t.auth.freelancer} hint={t.auth.freelancerHint} />
          </div>
        </fieldset>
        <TextField label={t.auth.fullName} name="name" autoComplete="name" error={fields.name} />
        <TextField label={t.auth.email} name="email" type="email" autoComplete="email" error={fields.email} />
        <TextField label={t.auth.password} name="password" type="password" autoComplete="new-password" error={fields.password} hint={t.v.min8} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label={t.auth.city} name="city" defaultValue="Душанбе">{CITIES.map((c) => <option key={c}>{c}</option>)}</SelectField>
          <SelectField label={t.auth.uiLanguage} name="uiLanguage" defaultValue={lang}>{LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}</SelectField>
        </div>
        {error && <FormMessage>{error}</FormMessage>}
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? t.auth.loading : t.auth.submitRegister}</button>
        <p className="text-center text-sm text-ink-muted">{t.auth.haveAccount} <Link href="/login" className="font-semibold text-brand-700 hover:underline">{t.auth.submitLogin}</Link></p>
      </form>
    </div>
  );
}
