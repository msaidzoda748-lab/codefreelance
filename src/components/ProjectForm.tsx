"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";
import { TextField, TextArea, SelectField, FormMessage } from "./ui/Field";
import FileUploader, { type UploadedFile } from "./ui/FileUploader";

export type ProjectFormValues = { id?: string; title: string; description: string; categoryId: string; skills: string; budget: number | ""; budgetMin: number | ""; budgetMax: number | ""; deadline: string; proposalDeadline: string; language: string; status?: string };
const today = () => new Date(new Date().toDateString());

export default function ProjectForm({ categories, initial }: { categories: { id: string; label: string }[]; initial?: ProjectFormValues }) {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"fixed" | "range">(initial?.budgetMin ? "range" : "fixed");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const isEdit = !!initial?.id;

  function validate(b: Record<string, string>) {
    const e: Record<string, string> = {};
    if (b.title.trim().length < 5) e.title = "min5";
    if (b.description.trim().length < 20) e.description = "min20";
    if (!b.categoryId) e.category = "required";
    if (mode === "range") { if (!(Number(b.budgetMin) >= 1) || Number(b.budgetMax) < Number(b.budgetMin)) e.budget = "range"; }
    else if (!(Number(b.budget) >= 1)) e.budget = "positive";
    const d = new Date(b.deadline);
    if (isNaN(d.getTime()) || d <= today()) e.deadline = "future";
    if (b.proposalDeadline) { const pd = new Date(b.proposalDeadline); if (pd < today()) e.proposalDeadline = "future"; else if (!e.deadline && pd > d) e.proposalDeadline = "beforeDeadline"; }
    return e;
  }
  async function save(publish: boolean, form: HTMLFormElement) {
    const b = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const fe = validate(b);
    setFields(fe); if (Object.keys(fe).length) { setError(t.errors.invalid); return; }
    setBusy(true); setError("");
    const body = { ...b, budgetMode: mode, publish, attachmentIds: files.map((f) => f.id) };
    const r = isEdit ? await api<{ id: string }>(`/api/projects/${initial!.id}`, { method: "PATCH", json: body }) : await api<{ id: string }>("/api/projects", { method: "POST", json: body });
    if (r.ok && isEdit && publish && initial?.status === "DRAFT") await api(`/api/projects/${initial.id}`, { method: "PATCH", json: { action: "publish" } });
    setBusy(false);
    if (!r.ok) { setFields(r.fields || {}); return setError(errorText(t, r.error)); }
    router.push(`/projects/${isEdit ? initial!.id : r.data.id}`); router.refresh();
  }
  const canDraft = !isEdit || initial?.status === "DRAFT";
  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); save(true, e.currentTarget); }} className="card space-y-5" data-testid="project-form">
      <TextField label={t.pf.title} name="title" defaultValue={initial?.title} error={fields.title} maxLength={160} />
      <TextArea label={t.pf.description} name="description" rows={7} defaultValue={initial?.description} error={fields.description} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label={t.pf.category} name="categoryId" defaultValue={initial?.categoryId || ""} error={fields.category}>
          <option value="">—</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </SelectField>
        <TextField label={t.pf.skills} name="skills" defaultValue={initial?.skills} placeholder="React, Node.js" />
      </div>
      <fieldset>
        <legend className="label">{t.pf.budgetMode}</legend>
        <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-1" role="radiogroup">
          {(["fixed", "range"] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`min-h-[40px] rounded-lg px-4 text-sm font-semibold ${mode === m ? "bg-white text-brand-700 shadow" : "text-ink-muted"}`}>{t.pf[m]}</button>)}
        </div>
        {mode === "fixed" ? <TextField label={t.pf.budget} name="budget" type="number" min={1} inputMode="numeric" defaultValue={initial?.budget} error={fields.budget} /> : (
          <div className="grid grid-cols-2 gap-4">
            <TextField label={t.pf.budgetMin} name="budgetMin" type="number" min={1} inputMode="numeric" defaultValue={initial?.budgetMin} error={fields.budget} />
            <TextField label={t.pf.budgetMax} name="budgetMax" type="number" min={1} inputMode="numeric" defaultValue={initial?.budgetMax} />
          </div>)}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label={t.pf.deadline} name="deadline" type="date" defaultValue={initial?.deadline} error={fields.deadline} />
        <TextField label={t.pf.proposalDeadline} name="proposalDeadline" type="date" defaultValue={initial?.proposalDeadline} error={fields.proposalDeadline} />
        <SelectField label={t.pf.language} name="language" defaultValue={initial?.language || "tj"}>{(["tj", "ru", "en"] as const).map((l) => <option key={l} value={l}>{t.pl[`lang_${l}`]}</option>)}</SelectField>
      </div>
      <div><span className="label">{t.pf.attachments}</span><FileUploader kind="projects" files={files} onChange={setFiles} /></div>
      {error && <FormMessage>{error}</FormMessage>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {canDraft && <button type="button" className="btn-secondary" disabled={busy} onClick={(e) => save(false, e.currentTarget.form!)} data-testid="save-draft">{t.pf.saveDraft}</button>}
        <button className="btn-primary" disabled={busy} data-testid="publish-project">{busy ? t.common.sending : isEdit && initial?.status !== "DRAFT" ? t.pf.saveChanges : t.pf.publish}</button>
      </div>
    </form>
  );
}
