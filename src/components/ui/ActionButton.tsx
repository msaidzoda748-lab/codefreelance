"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";
import Modal from "../Modal";
import { TextArea, FormMessage } from "./Field";

/**
 * Button that calls an API, optionally after a confirm dialog and/or a required text input (reason/comment).
 * On success refreshes the page (or navigates to `redirectTo` built from the response).
 */
export default function ActionButton({ url, method = "POST", body = {}, label, className = "btn-secondary", confirm, prompt, promptMin = 3, extraCheckbox, redirect, children, testId }: {
  url: string; method?: string; body?: Record<string, unknown>; label: string; className?: string; confirm?: string;
  prompt?: { label: string; field: string }; promptMin?: number; extraCheckbox?: { label: string; field: string };
  redirect?: (data: Record<string, unknown>) => string | null; children?: React.ReactNode; testId?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [check, setCheck] = useState(false);
  async function run() {
    if (prompt && text.trim().length < promptMin) return setError(t.v.min5);
    setBusy(true); setError("");
    const r = await api<Record<string, unknown>>(url, { method, json: { ...body, ...(prompt ? { [prompt.field]: text } : {}), ...(extraCheckbox ? { [extraCheckbox.field]: check } : {}) } });
    setBusy(false);
    if (!r.ok) return setError(errorText(t, r.error));
    setOpen(false); setText("");
    const to = redirect?.(r.data);
    if (to) router.push(to);
    router.refresh();
  }
  const needsDialog = !!(confirm || prompt);
  return (
    <>
      <button type="button" data-testid={testId} className={className} disabled={busy} onClick={() => (needsDialog ? setOpen(true) : run())}>{children}{label}</button>
      {error && !open && <span role="alert" className="field-error block">{error}</span>}
      {needsDialog && (
        <Modal open={open} onClose={() => setOpen(false)} title={label}>
          <div className="space-y-4">
            {confirm && <p className="text-sm text-ink-muted">{confirm}</p>}
            {prompt && <TextArea label={prompt.label} value={text} onChange={(e) => setText(e.target.value)} rows={3} />}
            {extraCheckbox && <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" checked={check} onChange={(e) => setCheck(e.target.checked)} className="h-5 w-5 accent-brand-600" />{extraCheckbox.label}</label>}
            {error && <FormMessage>{error}</FormMessage>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>{t.common.cancel}</button>
              <button type="button" className="btn-primary" disabled={busy} onClick={run} data-testid={testId ? `${testId}-confirm` : undefined}>{busy ? t.common.sending : t.common.confirm}</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
