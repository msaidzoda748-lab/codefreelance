"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Repeat, ShieldCheck } from "lucide-react";
import { LANGS, LANG_COOKIE } from "@/config/site";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";
import { CITIES } from "@/data/cities";
import Avatar from "@/components/Avatar";
import { TextField, SelectField, TextArea, FormMessage } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/States";

type Acc = { name: string; email: string; city: string; uiLanguage: string; avatarUrl: string | null; role: "CLIENT" | "FREELANCER"; isAdmin: boolean; hasFreelancer: boolean; hasClient: boolean; company: string; about: string };
const LANG_NAMES = { tj: "Тоҷикӣ", ru: "Русский", en: "English" } as const;

export default function AccountPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [acc, setAcc] = useState<Acc | null>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const load = async () => { const r = await api<{ user: Acc }>("/api/account"); if (r.ok) setAcc(r.data.user); else if (r.status === 401) router.push("/login?next=/account"); };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!acc) return <Spinner label={t.auth.loading} />;

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const r = await api("/api/account", { method: "PATCH", json: body });
    if (!r.ok) { setFields(r.fields || {}); return setMsg({ kind: "error", text: errorText(t, r.error) }); }
    setFields({});
    document.cookie = `${LANG_COOKIE}=${body.uiLanguage}; path=/; max-age=31536000; samesite=lax`;
    setMsg({ kind: "success", text: t.account.saved });
    router.refresh();
  }
  async function changePw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await api("/api/account", { method: "PATCH", json: { currentPassword: fd.get("currentPassword"), newPassword: fd.get("newPassword") } });
    if (!r.ok) { setFields(r.fields || {}); return setPwMsg({ kind: "error", text: errorText(t, r.error) }); }
    (e.target as HTMLFormElement).reset(); setFields({});
    setPwMsg({ kind: "success", text: t.account.saved });
  }
  async function upload(f: File) {
    const fd = new FormData(); fd.append("file", f); fd.append("kind", "avatars");
    const r = await api<{ avatarUrl: string }>("/api/upload", { method: "POST", body: fd });
    if (!r.ok) return setMsg({ kind: "error", text: errorText(t, r.error) });
    setAcc({ ...acc!, avatarUrl: r.data.avatarUrl }); router.refresh();
  }
  async function switchRole(role: "CLIENT" | "FREELANCER") {
    const r = await api("/api/auth/switch-role", { method: "POST", json: { role } });
    if (!r.ok) return setMsg({ kind: "error", text: errorText(t, r.error) });
    await load(); router.refresh();
  }
  const other = acc.role === "CLIENT" ? "FREELANCER" : "CLIENT";
  return (
    <div className="mx-auto grid max-w-2xl animate-slide-up gap-5">
      <h1 className="text-2xl font-extrabold text-ink dark:text-white">{t.account.title}</h1>
      <section className="card flex flex-wrap items-center gap-4">
        <Avatar name={acc.name} src={acc.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{acc.name}</p>
          <p className="truncate text-sm text-ink-muted">{acc.email}</p>
          {acc.isAdmin && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />{t.account.admin}</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={t.account.avatar} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary"><Camera className="h-4 w-4" aria-hidden />{t.account.upload}</button>
        <p className="w-full text-xs text-ink-muted">{t.account.avatarHint}</p>
      </section>
      <section className="card space-y-3" aria-labelledby="roles-h">
        <h2 id="roles-h" className="font-bold text-ink">{t.account.roles}</h2>
        <p className="text-sm text-ink-muted">{t.account.rolesHint}</p>
        <p className="text-sm">{t.account.activeRole}: <strong className="text-brand-700">{acc.role === "CLIENT" ? t.auth.client : t.auth.freelancer}</strong></p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => switchRole(other)} className="btn-primary"><Repeat className="h-4 w-4" aria-hidden />{t.account.switchTo} {other === "CLIENT" ? t.auth.client : t.auth.freelancer}</button>
          {acc.hasFreelancer && <Link href="/profile" className="btn-secondary no-underline">{t.account.editProfile}</Link>}
        </div>
      </section>
      <form onSubmit={save} className="card space-y-4" noValidate>
        <TextField label={t.auth.fullName} name="name" defaultValue={acc.name} error={fields.name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label={t.auth.city} name="city" defaultValue={acc.city}>{[...new Set([acc.city, ...CITIES])].map((c) => <option key={c}>{c}</option>)}</SelectField>
          <SelectField label={t.auth.uiLanguage} name="uiLanguage" defaultValue={acc.uiLanguage}>{LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}</SelectField>
        </div>
        {acc.hasClient && (<>
          <TextField label={t.account.company} name="company" defaultValue={acc.company} />
          <TextArea label={t.account.about} name="about" defaultValue={acc.about} />
        </>)}
        {msg && <FormMessage kind={msg.kind}>{msg.text}</FormMessage>}
        <button className="btn-primary">{t.account.save}</button>
      </form>
      <form onSubmit={changePw} className="card space-y-4" noValidate aria-labelledby="pw-h">
        <h2 id="pw-h" className="font-bold text-ink">{t.account.changePassword}</h2>
        <TextField label={t.auth.currentPassword} name="currentPassword" type="password" autoComplete="current-password" error={fields.currentPassword} />
        <TextField label={t.auth.newPassword} name="newPassword" type="password" autoComplete="new-password" error={fields.newPassword} />
        {pwMsg && <FormMessage kind={pwMsg.kind}>{pwMsg.text}</FormMessage>}
        <button className="btn-secondary">{t.auth.savePassword}</button>
      </form>
    </div>
  );
}
