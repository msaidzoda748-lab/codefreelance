"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";
import Modal from "./Modal";
import AuthPrompt from "./AuthPrompt";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";
import { TextField, TextArea, FormMessage } from "./ui/Field";
import FileUploader, { type UploadedFile } from "./ui/FileUploader";

type Existing = { id: string; price: number; deliveryDays: number; coverLetter: string; portfolioIds: string[] };

/** Create a proposal, or edit an existing one when `existing` is given. */
export default function ProposalModal({ open, onClose, project, existing }: { open: boolean; onClose: () => void; project: { id: string; title: string; budget: number }; existing?: Existing }) {
  const { t, user } = useI18n();
  const router = useRouter();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [items, setItems] = useState<{ id: string; title: string }[]>([]);
  const [picked, setPicked] = useState<string[]>(existing?.portfolioIds || []);
  const canPropose = !!user && (user.role === "FREELANCER" || user.hasFreelancer);

  useEffect(() => {
    if (!open || !canPropose) return;
    api<{ portfolio: { id: string; title: string }[] }>("/api/profile/me").then((r) => r.ok && setItems(r.data.portfolio || []));
  }, [open, canPropose]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const price = Number(fd.get("price")), deliveryDays = Number(fd.get("days")), coverLetter = String(fd.get("text") || "").trim();
    const fe: Record<string, string> = {};
    if (!Number.isInteger(price) || price < 1) fe.price = "price";
    if (!Number.isInteger(deliveryDays) || deliveryDays < 1 || deliveryDays > 365) fe.deliveryDays = "days";
    if (coverLetter.length < 20) fe.coverLetter = "min20";
    setFields(fe); if (Object.keys(fe).length) return;
    setLoading(true); setServerError("");
    const body = { projectId: project.id, price, deliveryDays, coverLetter, portfolioItemIds: picked, attachmentIds: files.map((f) => f.id) };
    const r = existing ? await api(`/api/proposals/${existing.id}`, { method: "PATCH", json: body }) : await api("/api/proposals", { method: "POST", json: body });
    setLoading(false);
    if (!r.ok) { setFields(r.fields || {}); return setServerError(errorText(t, r.error)); }
    setDone(true); router.refresh();
  }
  const close = () => { onClose(); setTimeout(() => { setDone(false); setFields({}); setServerError(""); }, 200); };

  return (
    <Modal open={open} onClose={close} title={existing ? t.prop.update : t.prop.title}>
      <p className="-mt-2 mb-4 text-sm font-medium text-brand-700">{project.title}</p>
      {!user ? <AuthPrompt message={t.prop.needLogin} /> :
       !canPropose ? <p role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{t.prop.onlyFreelancer}</p> :
       done ? (
        <div className="text-center" role="status">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand-600" aria-hidden />
          <p className="mt-3 font-semibold text-ink">{existing ? t.prop.updated : t.prop.success}</p>
          <Link href={`/projects/${project.id}`} onClick={close} className="btn-primary mt-5 w-full no-underline">{t.common.view}</Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4" data-testid="proposal-form">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t.prop.price} name="price" type="number" inputMode="numeric" min={1} defaultValue={existing?.price ?? project.budget} error={fields.price} />
            <TextField label={t.prop.days} name="days" type="number" inputMode="numeric" min={1} max={365} defaultValue={existing?.deliveryDays ?? 7} error={fields.deliveryDays} />
          </div>
          <TextArea label={t.prop.text} name="text" rows={5} placeholder={t.prop.textPh} defaultValue={existing?.coverLetter} error={fields.coverLetter} />
          {items.length > 0 && (
            <fieldset><legend className="label">{t.prop.portfolio}</legend>
              <div className="flex flex-wrap gap-2">{items.map((it) => (
                <label key={it.id} className={`inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm ${picked.includes(it.id) ? "border-brand-400 bg-brand-50" : "border-line"}`}>
                  <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={picked.includes(it.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, it.id] : picked.filter((x) => x !== it.id))} />{it.title}
                </label>))}</div>
            </fieldset>)}
          <div><span className="label">{t.prop.files}</span><FileUploader kind="proposals" files={files} onChange={setFiles} /></div>
          {serverError && <FormMessage>{serverError}</FormMessage>}
          <button className="btn-primary w-full" disabled={loading}><Send className="h-4 w-4" aria-hidden />{loading ? t.common.sending : existing ? t.prop.update : t.prop.send}</button>
          <p className="text-center text-xs text-ink-muted">{t.common.noPayments}</p>
        </form>
      )}
    </Modal>
  );
}

export function ProposalButton({ project, existing, label, className = "btn-primary" }: { project: { id: string; title: string; budget: number }; existing?: Existing; label: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className={className} onClick={() => setOpen(true)} data-testid={existing ? "edit-proposal" : "open-proposal"}>{label}</button><ProposalModal open={open} onClose={() => setOpen(false)} project={project} existing={existing} /></>;
}
