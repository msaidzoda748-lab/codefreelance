"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";
import { TextField, TextArea, FormMessage } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/States";
import ImageUploadButton from "@/components/ImageUploadButton";
import Modal from "@/components/Modal";

type P = { name: string; city: string; avatarUrl: string | null; title: string; bio: string; skills: string; languages: string; rateMin: number | null; rateMax: number | null; experienceYears: number; available: boolean; coverUrl: string | null };
type Item = { id: string; title: string; description: string; tech: string; link: string | null; images: string };

export default function MyProfilePage() {
  const { t, user } = useI18n();
  const router = useRouter();
  const [p, setP] = useState<P | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<Item | "new" | null>(null);
  const [itemErr, setItemErr] = useState("");
  const [images, setImages] = useState<string[]>([]);

  async function load() {
    const r = await api<{ profile: P; portfolio: Item[] }>("/api/profile/me");
    if (!r.ok) { if (r.status === 401) router.push("/login?next=/profile"); else setMsg({ kind: "error", text: errorText(t, r.error) }); return; }
    setP(r.data.profile); setItems(r.data.portfolio);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = { ...Object.fromEntries(fd.entries()), available: fd.get("available") === "on" };
    setBusy(true); setMsg(null);
    const r = await api("/api/profile", { method: "PUT", json: body });
    setBusy(false);
    if (!r.ok) { setFields(r.fields || {}); return setMsg({ kind: "error", text: errorText(t, r.error) }); }
    setFields({}); setMsg({ kind: "success", text: t.account.saved }); router.refresh();
  }
  async function saveItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = { ...Object.fromEntries(new FormData(e.currentTarget).entries()), images };
    const r = edit === "new" ? await api("/api/portfolio", { method: "POST", json: body }) : await api(`/api/portfolio/${(edit as Item).id}`, { method: "PATCH", json: body });
    if (!r.ok) return setItemErr(errorText(t, r.error) + (r.fields ? `: ${Object.keys(r.fields).join(", ")}` : ""));
    setEdit(null); load();
  }
  async function del(id: string) {
    if (!confirm(t.common.delete + "?")) return;
    await api(`/api/portfolio/${id}`, { method: "DELETE" }); load();
  }
  const openItem = (i: Item | "new") => { setEdit(i); setItemErr(""); setImages(i === "new" ? [] : i.images.split("\n").filter(Boolean)); };

  if (!p) return msg ? <div className="mx-auto max-w-2xl"><FormMessage>{msg.text}</FormMessage>{user && <Link href="/account" className="btn-secondary mt-4 no-underline">{t.nav.account}</Link>}</div> : <Spinner label={t.common.loading} />;
  const cur = edit && edit !== "new" ? edit : null;
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">{t.prof.editTitle}</h1>
        {user && <Link href={`/freelancers/${user.id}`} className="btn-ghost no-underline">{t.prof.viewProfile}</Link>}
      </div>
      <form onSubmit={save} className="card space-y-4" noValidate>
        <div className="overflow-hidden rounded-2xl">
          {p.coverUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.coverUrl} alt="" className="h-28 w-full object-cover" /> : <div className="h-28 bg-hero-gradient" />}
        </div>
        <ImageUploadButton kind="covers" label={t.prof.cover} onDone={(url) => setP({ ...p, coverUrl: url })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t.auth.fullName} name="name" defaultValue={p.name} />
          <TextField label={t.prof.specialty} name="title" defaultValue={p.title} error={fields.title} />
        </div>
        <TextArea label={t.prof.bio} name="bio" rows={5} defaultValue={p.bio} />
        <TextField label={t.prof.skills} name="skills" defaultValue={p.skills} />
        <TextField label={t.prof.languages} name="languages" defaultValue={p.languages} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label={t.prof.rateMin} name="rateMin" type="number" min={0} defaultValue={p.rateMin ?? ""} error={fields.rateMin} />
          <TextField label={t.prof.rateMax} name="rateMax" type="number" min={0} defaultValue={p.rateMax ?? ""} error={fields.rateMax} />
          <TextField label={t.prof.experience} name="experienceYears" type="number" min={0} max={60} defaultValue={p.experienceYears} />
        </div>
        <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" name="available" defaultChecked={p.available} className="h-5 w-5 accent-brand-600" />{t.prof.available}</label>
        {msg && <FormMessage kind={msg.kind}>{msg.text}</FormMessage>}
        <button className="btn-primary" disabled={busy}>{busy ? t.common.sending : t.common.save}</button>
      </form>

      <section className="card space-y-4" aria-labelledby="pf-h">
        <div className="flex items-center justify-between"><h2 id="pf-h" className="text-lg font-bold text-ink">{t.prof.portfolio}</h2><button type="button" className="btn-secondary" onClick={() => openItem("new")}><Plus className="h-4 w-4" aria-hidden />{t.prof.addItem}</button></div>
        {items.length ? <ul className="divide-y divide-line">{items.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0"><p className="truncate font-semibold">{i.title}</p><p className="truncate text-xs text-ink-muted">{i.tech}</p></div>
            <div className="flex gap-1">
              <button type="button" aria-label={`${t.common.edit}: ${i.title}`} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100" onClick={() => openItem(i)}><Pencil className="h-4 w-4" /></button>
              <button type="button" aria-label={`${t.common.delete}: ${i.title}`} className="flex h-11 w-11 items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50" onClick={() => del(i.id)}><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>))}</ul> : <p className="text-sm text-ink-muted">{t.prof.emptyPortfolio}</p>}
      </section>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? t.prof.addItem : t.common.edit}>
        <form onSubmit={saveItem} className="space-y-4" key={cur?.id || "new"}>
          <TextField label={t.prof.itemTitle} name="title" defaultValue={cur?.title} />
          <TextArea label={t.prof.itemDesc} name="description" rows={3} defaultValue={cur?.description} />
          <TextField label={t.prof.itemTech} name="tech" defaultValue={cur?.tech} />
          <TextField label={t.prof.itemLink} name="link" type="url" defaultValue={cur?.link || ""} />
          <div><span className="label">{t.prof.itemImages}</span>
            <div className="mb-2 flex flex-wrap gap-2">{images.map((u) => <button type="button" key={u} onClick={() => setImages(images.filter((x) => x !== u))} aria-label={t.common.remove} className="relative">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={u} alt="" className="h-16 w-24 rounded-lg object-cover" /></button>)}</div>
            {images.length < 6 && <ImageUploadButton kind="portfolio" label={t.common.attach} onDone={(u) => setImages([...images, u])} />}
          </div>
          {itemErr && <FormMessage>{itemErr}</FormMessage>}
          <button className="btn-primary w-full">{t.common.save}</button>
        </form>
      </Modal>
    </div>
  );
}
