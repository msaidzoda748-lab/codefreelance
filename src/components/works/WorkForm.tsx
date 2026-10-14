"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Apple, Download, Github, Globe, Play, Star, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";
import { TextField, TextArea, SelectField, FormMessage } from "../ui/Field";
import ImageUploadButton from "../ImageUploadButton";

export type WorkFormValues = { id?: string; title: string; description: string; categoryId: string; tech: string; images: string[]; link: string; appStoreUrl: string; playUrl: string; sourceUrl: string; downloadUrl: string };
const LINKS = [
  { k: "link", icon: Globe, ph: "https://example.tj" },
  { k: "appStoreUrl", icon: Apple, ph: "https://apps.apple.com/app/…" },
  { k: "playUrl", icon: Play, ph: "https://play.google.com/store/apps/details?id=…" },
  { k: "sourceUrl", icon: Github, ph: "https://github.com/…" },
  { k: "downloadUrl", icon: Download, ph: "https://…/app.apk" },
] as const;

/** Client-side mirror of the server URL rules (server is authoritative). */
function checkUrl(k: string, v: string) {
  if (!v.trim()) return "";
  try {
    const u = new URL(v.trim());
    if (u.protocol !== "https:" || !u.hostname.includes(".")) return "https";
    if (k === "appStoreUrl" && !/^(apps|itunes)\.apple\.com$/i.test(u.hostname)) return "host";
    if (k === "playUrl" && !/^play\.google\.com$/i.test(u.hostname)) return "host";
    return "";
  } catch { return "https"; }
}

export default function WorkForm({ categories, initial }: { categories: { id: string; label: string }[]; initial?: WorkFormValues }) {
  const { t } = useI18n();
  const router = useRouter();
  const [images, setImages] = useState<string[]>(initial?.images || []);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isEdit = !!initial?.id;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const b = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const fe: Record<string, string> = {};
    if (b.title.trim().length < 3) fe.title = "min3";
    for (const l of LINKS) { const x = checkUrl(l.k, b[l.k] || ""); if (x) fe[l.k] = x; }
    setFields(fe);
    if (Object.keys(fe).length) return setError(t.errors.invalid);
    setBusy(true); setError("");
    const body = { ...b, images };
    const r = isEdit ? await api<{ id: string }>(`/api/portfolio/${initial!.id}`, { method: "PATCH", json: body }) : await api<{ id: string }>("/api/portfolio", { method: "POST", json: body });
    setBusy(false);
    if (!r.ok) { setFields(r.fields || {}); return setError(errorText(t, r.error)); }
    router.push(`/works/${isEdit ? initial!.id : r.data.id}`); router.refresh();
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-6" data-testid="work-form">
      <section className="card space-y-5">
        <TextField label={t.works.name} name="title" defaultValue={initial?.title} error={fields.title} maxLength={160} />
        <TextArea label={t.works.desc} name="description" rows={6} defaultValue={initial?.description} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label={t.pf.category} name="categoryId" defaultValue={initial?.categoryId || ""}>
            <option value="">—</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </SelectField>
          <TextField label={t.works.techField} name="tech" defaultValue={initial?.tech} placeholder="React Native, Firebase" />
        </div>
      </section>

      <section className="card space-y-3" aria-labelledby="wi-h">
        <h2 id="wi-h" className="label !mb-0">{t.works.images}</h2>
        {images.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="work-images">
            {images.map((u, k) => (
              <li key={u} className={`group relative overflow-hidden rounded-xl ring-1 ${k === 0 ? "ring-2 ring-brand-500" : "ring-line"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="aspect-[4/3] w-full object-cover" />
                {k === 0 && <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">{t.works.cover}</span>}
                <div className="absolute right-1 top-1 flex gap-1">
                  {k > 0 && <button type="button" onClick={() => setImages([u, ...images.filter((x) => x !== u)])} aria-label={t.works.makeCover} title={t.works.makeCover} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-brand-700 shadow"><Star className="h-4 w-4" /></button>}
                  <button type="button" onClick={() => setImages(images.filter((x) => x !== u))} aria-label={t.common.remove} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-rose-600 shadow"><X className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {images.length < 8 && <ImageUploadButton kind="portfolio" label={t.common.attach} onDone={(u) => setImages((x) => [...x, u])} />}
      </section>

      <section className="card space-y-4" aria-labelledby="wl-h">
        <div><h2 id="wl-h" className="label !mb-0">{t.works.links}</h2><p className="text-xs text-ink-muted">{t.works.linksHint}</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {LINKS.map((l) => (
            <div key={l.k} className="relative">
              <TextField label={t.works[l.k]} name={l.k} type="url" inputMode="url" placeholder={l.ph} defaultValue={initial?.[l.k] || ""} error={fields[l.k]} data-testid={`wf-${l.k}`} />
              <l.icon className="pointer-events-none absolute right-3 top-[38px] h-4 w-4 text-slate-400" aria-hidden />
            </div>
          ))}
        </div>
      </section>

      {error && <FormMessage>{error}</FormMessage>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={() => router.back()}>{t.common.cancel}</button>
        <button className="btn-primary" disabled={busy} data-testid="work-save">{busy ? t.common.sending : isEdit ? t.pf.saveChanges : t.works.add}</button>
      </div>
    </form>
  );
}
