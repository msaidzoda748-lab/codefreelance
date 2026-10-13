"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";
import Modal from "../Modal";
import { TextArea, FormMessage } from "../ui/Field";
import FileUploader, { type UploadedFile } from "../ui/FileUploader";

export default function SubmitWork({ milestoneId }: { milestoneId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (msg.trim().length < 5 && !files.length) return setError(t.v.min5);
    setBusy(true);
    const r = await api(`/api/milestones/${milestoneId}`, { method: "POST", json: { action: "submit", message: msg, attachmentIds: files.map((f) => f.id) } });
    setBusy(false);
    if (!r.ok) return setError(errorText(t, r.error));
    setOpen(false); setFiles([]); setMsg(""); router.refresh();
  }
  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)} data-testid="submit-work"><Upload className="h-4 w-4" aria-hidden />{t.ord.submit}</button>
      <Modal open={open} onClose={() => setOpen(false)} title={t.ord.submit}>
        <form onSubmit={submit} className="space-y-4">
          <TextArea label={t.ord.submitMsg} value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} />
          <FileUploader kind="submissions" files={files} onChange={setFiles} />
          {error && <FormMessage>{error}</FormMessage>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? t.common.sending : t.common.submit}</button>
        </form>
      </Modal>
    </>
  );
}
