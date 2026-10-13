"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Send } from "lucide-react";
import Modal from "./Modal";
import AuthPrompt from "./AuthPrompt";
import { useI18n } from "@/i18n/I18nProvider";

type Errors = Partial<Record<"amount" | "deadline" | "text", string>>;
const today = () => new Date(new Date().toDateString());

export default function ProposalModal({ open, onClose, project }: { open: boolean; onClose: () => void; project: { id: string; title: string; budget: number } }) {
  const { t, user } = useI18n();
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("amount"));
    const deadline = new Date(String(fd.get("deadline")));
    const text = String(fd.get("text") || "").trim();
    const errs: Errors = {};
    if (!amount || amount < 1 || !Number.isInteger(amount)) errs.amount = t.proposal.errAmount;
    if (isNaN(deadline.getTime()) || deadline <= today()) errs.deadline = t.proposal.errDeadline;
    if (text.length < 20) errs.text = t.proposal.errText;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true); setServerError("");
    try {
      const deliveryDays = Math.max(1, Math.ceil((deadline.getTime() - today().getTime()) / 86400000));
      const res = await fetch("/api/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, price: amount, deliveryDays, coverLetter: text }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setServerError(data.error || `HTTP ${res.status}`); return; }
      setDone(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Network error");
    } finally { setLoading(false); }
  }
  const close = () => { onClose(); setTimeout(() => { setDone(false); setErrors({}); setServerError(""); }, 200); };

  return (
    <Modal open={open} onClose={close} title={t.proposal.title}>
      <p className="-mt-2 mb-4 text-sm font-medium text-brand-700">{project.title}</p>
      {!user ? <AuthPrompt message={t.proposal.needLogin} /> :
       user.role !== "FREELANCER" ? <p role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{t.proposal.onlyFreelancer}</p> :
       done ? (
        <div className="text-center" role="status">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand-600" />
          <p className="mt-3 font-semibold text-ink">{t.proposal.success}</p>
          <Link href={`/projects/${project.id}`} className="btn-primary mt-5 w-full no-underline">{t.proposal.view}</Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pm-amount" className="label">{t.proposal.amount}</label>
              <input id="pm-amount" name="amount" type="number" inputMode="numeric" min={1} defaultValue={project.budget} className="input" aria-invalid={!!errors.amount} aria-describedby="pm-amount-err" />
              {errors.amount && <p id="pm-amount-err" className="field-error">{errors.amount}</p>}
            </div>
            <div>
              <label htmlFor="pm-deadline" className="label">{t.proposal.deadline}</label>
              <input id="pm-deadline" name="deadline" type="date" className="input" aria-invalid={!!errors.deadline} aria-describedby="pm-deadline-err" />
              {errors.deadline && <p id="pm-deadline-err" className="field-error">{errors.deadline}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="pm-text" className="label">{t.proposal.text}</label>
            <textarea id="pm-text" name="text" rows={5} placeholder={t.proposal.textPh} className="input" aria-invalid={!!errors.text} aria-describedby="pm-text-err" />
            {errors.text && <p id="pm-text-err" className="field-error">{errors.text}</p>}
          </div>
          {serverError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{serverError}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} className="btn-secondary">{t.proposal.cancel}</button>
            <button type="submit" disabled={loading} className="btn-primary"><Send className="h-4 w-4" />{loading ? t.proposal.sending : t.proposal.submit}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
