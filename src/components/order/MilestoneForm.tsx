"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";
import Modal from "../Modal";
import { TextField, TextArea, FormMessage } from "../ui/Field";

type M = { id: string; title: string; description: string; deadline: string; amount: number | null };
export default function MilestoneForm({ orderId, milestone }: { orderId: string; milestone?: M }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries()) as Record<string, string>;
    const fe: Record<string, string> = {};
    if ((body.title || "").trim().length < 3) fe.title = "min3";
    if (!body.deadline) fe.deadline = "required";
    setFields(fe); if (Object.keys(fe).length) return;
    const r = await api(`/api/orders/${orderId}/milestones`, { method: "POST", json: { ...body, id: milestone?.id } });
    if (!r.ok) return setError(errorText(t, r.error));
    setOpen(false); router.refresh();
  }
  return (
    <>
      <button type="button" className={milestone ? "btn-ghost !min-h-[44px] sm:!min-h-[36px] !px-2 text-xs" : "btn-secondary"} onClick={() => setOpen(true)} data-testid={milestone ? "edit-ms" : "add-ms"}>
        {milestone ? <Pencil className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}{milestone ? t.common.edit : t.ord.addMilestone}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={milestone ? t.common.edit : t.ord.addMilestone}>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextField label={t.ord.mTitle} name="title" defaultValue={milestone?.title} error={fields.title} />
          <TextArea label={t.ord.mDesc} name="description" rows={3} defaultValue={milestone?.description} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t.ord.mDeadline} name="deadline" type="date" defaultValue={milestone?.deadline?.slice(0, 10)} error={fields.deadline} />
            <TextField label={t.ord.mAmount} name="amount" type="number" min={0} inputMode="numeric" defaultValue={milestone?.amount ?? ""} />
          </div>
          {error && <FormMessage>{error}</FormMessage>}
          <button className="btn-primary w-full">{t.common.save}</button>
        </form>
      </Modal>
    </>
  );
}
