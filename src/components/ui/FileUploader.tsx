"use client";
import { useRef, useState } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";

export type UploadedFile = { id: string; name: string; mimeType: string; size: number; url: string };

/** Uploads immediately to /api/upload; parent receives attachment ids to link on save. */
export default function FileUploader({ kind, files, onChange, max = 5, label }: { kind: "projects" | "proposals" | "chat" | "submissions"; files: UploadedFile[]; onChange: (f: UploadedFile[]) => void; max?: number; label?: string }) {
  const { t } = useI18n();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(list: FileList) {
    setBusy(true); setError("");
    const out = [...files];
    for (const f of Array.from(list).slice(0, max - files.length)) {
      const fd = new FormData(); fd.append("file", f); fd.append("kind", kind);
      const r = await api<{ attachment: UploadedFile }>("/api/upload", { method: "POST", body: fd });
      if (r.ok) out.push(r.data.attachment); else setError(`${f.name}: ${errorText(t, r.error)}`);
    }
    onChange(out); setBusy(false);
    if (ref.current) ref.current.value = "";
  }
  return (
    <div>
      <input ref={ref} type="file" multiple className="sr-only" aria-label={label || t.common.attach} accept="image/*,.pdf,.txt,.doc,.docx,.zip" onChange={(e) => e.target.files && upload(e.target.files)} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary" disabled={busy || files.length >= max} onClick={() => ref.current?.click()}><Paperclip className="h-4 w-4" aria-hidden />{busy ? t.common.uploading : label || t.common.attach}</button>
        {files.map((f) => (
          <span key={f.id} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 py-1 pl-3 pr-1 text-xs">
            <FileText className="h-3.5 w-3.5" aria-hidden />{f.name}
            <button type="button" aria-label={`${t.common.remove}: ${f.name}`} onClick={() => onChange(files.filter((x) => x.id !== f.id))} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-200"><X className="h-3.5 w-3.5" /></button>
          </span>
        ))}
      </div>
      {error && <p role="alert" className="field-error">{error}</p>}
    </div>
  );
}
export function AttachmentList({ files }: { files: { id: string; name: string; url: string; mimeType: string }[] }) {
  if (!files.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {files.map((a) => (
        <li key={a.id}>
          <a href={a.url} target="_blank" rel="noreferrer" className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-line bg-slate-50 px-3 text-xs font-medium text-navy-800 no-underline hover:border-brand-300">
            <FileText className="h-3.5 w-3.5" aria-hidden />{a.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
