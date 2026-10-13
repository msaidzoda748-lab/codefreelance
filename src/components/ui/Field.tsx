"use client";
import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { fieldText } from "@/i18n/format";

type Base = { label: string; error?: string; hint?: string; className?: string };

function Wrap({ id, label, error, hint, className, children }: Base & { id: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-ink-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="field-error">{fieldText(t, error)}</p>}
    </div>
  );
}

export function TextField({ label, error, hint, className, type = "text", ...rest }: Base & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <Wrap id={id} label={label} error={error} hint={hint} className={className}>
      <div className="relative">
        <input id={id} type={isPw && show ? "text" : type} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} className={`input ${isPw ? "pr-12" : ""}`} {...rest} />
        {isPw && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={t.auth.showPassword} aria-pressed={show}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </Wrap>
  );
}
export function TextArea({ label, error, hint, className, ...rest }: Base & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Wrap id={id} label={label} error={error} hint={hint} className={className}>
      <textarea id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className="input" rows={4} {...rest} />
    </Wrap>
  );
}
export function SelectField({ label, error, hint, className, children, ...rest }: Base & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Wrap id={id} label={label} error={error} hint={hint} className={className}>
      <select id={id} aria-invalid={!!error} className="input" {...rest}>{children}</select>
    </Wrap>
  );
}
export function FormMessage({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: React.ReactNode }) {
  const cls = kind === "error" ? "bg-rose-50 text-rose-700 ring-rose-100" : kind === "success" ? "bg-brand-50 text-brand-800 ring-brand-100" : "bg-amber-50 text-amber-800 ring-amber-100";
  return <div role={kind === "error" ? "alert" : "status"} className={`rounded-2xl p-3.5 text-sm ring-1 ${cls}`}>{children}</div>;
}
