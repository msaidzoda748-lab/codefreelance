"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, UserPlus } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";
import Modal from "./Modal";
import { SelectField, TextArea, FormMessage } from "./ui/Field";

/** "Write" (opens/creates a direct conversation) and "Invite to project" (client's open projects). */
export default function ProfileActions({ userId, openProjects, canInvite }: { userId: string; openProjects: { id: string; title: string }[]; canInvite: boolean }) {
  const { t, user } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  if (user?.id === userId) return null;
  async function write() {
    if (!user) return router.push(`/login?next=/freelancers/${userId}`);
    const r = await api<{ id: string }>("/api/conversations", { method: "POST", json: { userId } });
    if (r.ok) router.push(`/messages/${r.data.id}`); else setError(errorText(t, r.error));
  }
  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await api("/api/invite", { method: "POST", json: { projectId: fd.get("projectId"), freelancerId: userId, message: fd.get("message") } });
    if (!r.ok) return setError(errorText(t, r.error));
    setDone(true);
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={write} className="btn-primary" data-testid="write"><MessageCircle className="h-4 w-4" aria-hidden />{t.prof.write}</button>
      {canInvite && <button type="button" onClick={() => (user ? setOpen(true) : router.push(`/login?next=/freelancers/${userId}`))} className="btn-secondary" data-testid="invite"><UserPlus className="h-4 w-4" aria-hidden />{t.prof.invite}</button>}
      {error && !open && <p role="alert" className="field-error w-full">{error}</p>}
      <Modal open={open} onClose={() => { setOpen(false); setDone(false); }} title={t.prof.invite}>
        {done ? <FormMessage kind="success">{t.prof.invited}</FormMessage> : !openProjects.length ? <p className="text-sm text-ink-muted">{t.prof.noOpenProjects}</p> : (
          <form onSubmit={invite} className="space-y-4">
            <SelectField label={t.prof.inviteChoose} name="projectId">{openProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</SelectField>
            <TextArea label={t.prof.inviteMsg} name="message" rows={3} />
            {error && <FormMessage>{error}</FormMessage>}
            <button className="btn-primary w-full">{t.common.submit}</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
