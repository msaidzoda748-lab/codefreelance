"use client";
import { useState } from "react";
import { Flag } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";
import Modal from "./Modal";
import { SelectField, TextArea, FormMessage } from "./ui/Field";

export default function ReportButton({ targetType, targetId }: { targetType: "REVIEW" | "PROJECT" | "USER" | "MESSAGE"; targetId: string }) {
  const { t, user } = useI18n();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  if (!user) return null;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await api("/api/reports", { method: "POST", json: { targetType, targetId, reason: fd.get("reason"), details: fd.get("details") } });
    if (!r.ok) return setError(errorText(t, r.error));
    setDone(true);
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={t.rev.report}><Flag className="h-3.5 w-3.5" aria-hidden />{t.rev.report}</button>
      <Modal open={open} onClose={() => { setOpen(false); setDone(false); }} title={t.rev.report}>
        {done ? <FormMessage kind="success">{t.rev.reported}</FormMessage> : (
          <form onSubmit={submit} className="space-y-4">
            <SelectField label={t.rev.reportReason} name="reason">{(["spam", "abuse", "fake", "other"] as const).map((r) => <option key={r} value={r}>{t.rev[`r_${r}`]}</option>)}</SelectField>
            <TextArea label={t.common.comment} name="details" rows={3} />
            {error && <FormMessage>{error}</FormMessage>}
            <button className="btn-primary w-full">{t.common.submit}</button>
          </form>
        )}
      </Modal>
    </>
  );
}
