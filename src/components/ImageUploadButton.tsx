"use client";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";

export default function ImageUploadButton({ kind, label, onDone }: { kind: "avatars" | "covers" | "portfolio"; label: string; onDone: (url: string) => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function up(f: File) {
    setBusy(true); setErr("");
    const fd = new FormData(); fd.append("file", f); fd.append("kind", kind);
    const r = await api<{ url: string }>("/api/upload", { method: "POST", body: fd });
    setBusy(false);
    if (r.ok) onDone(r.data.url); else setErr(errorText(t, r.error));
    if (ref.current) ref.current.value = "";
  }
  return (
    <span>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={label} onChange={(e) => e.target.files?.[0] && up(e.target.files[0])} />
      <button type="button" className="btn-secondary" disabled={busy} onClick={() => ref.current?.click()}><Camera className="h-4 w-4" aria-hidden />{busy ? t.common.uploading : label}</button>
      {err && <span role="alert" className="field-error block">{err}</span>}
    </span>
  );
}
