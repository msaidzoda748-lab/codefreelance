"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Rocket } from "lucide-react";
import Modal from "./Modal";
import AuthPrompt from "./AuthPrompt";
import { useI18n } from "@/i18n/I18nProvider";

export const OPEN_CREATE_EVENT = "cf:create-project";
export function openCreateProject() { window.dispatchEvent(new Event(OPEN_CREATE_EVENT)); }

type Errors = Partial<Record<"title" | "description" | "budget" | "deadline", string>>;

export default function CreateProjectModal() {
  const { t, user, lang } = useI18n();
  const [cats, setCats] = useState<{ id: string; nameTj: string; nameRu: string; nameEn: string }[]>([]);
  const [mode, setMode] = useState<"fixed" | "range">("fixed");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdId, setCreatedId] = useState("");

  useEffect(() => {
    const h = () => {
      setOpen(true);
      if (!cats.length) fetch("/api/categories").then((r) => r.json()).then((d) => setCats(d.items || [])).catch(() => {});
    };
    window.addEventListener(OPEN_CREATE_EVENT, h);
    return () => window.removeEventListener(OPEN_CREATE_EVENT, h);
  }, [cats.length]);
  const close = () => { setOpen(false); setTimeout(() => { setCreatedId(""); setErrors({}); setServerError(""); }, 200); };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") || "").trim();
    const description = String(fd.get("description") || "").trim();
    const budget = Number(fd.get("budget"));
    const budgetMin = Number(fd.get("budgetMin"));
    const budgetMax = Number(fd.get("budgetMax"));
    const deadlineStr = String(fd.get("deadline") || "");
    const deadline = new Date(deadlineStr);
    const errs: Errors = {};
    if (title.length < 5) errs.title = t.create.errName;
    if (description.length < 20) errs.description = t.create.errDesc;
    if (mode === "fixed" ? (!budget || budget < 1 || !Number.isInteger(budget)) : (!(budgetMin >= 1) || !Number.isInteger(budgetMin) || !Number.isInteger(budgetMax) || budgetMax < budgetMin)) errs.budget = t.create.errBudget;
    if (isNaN(deadline.getTime()) || deadline <= new Date(new Date().toDateString())) errs.deadline = t.create.errDeadline;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true); setServerError("");
    try {
      const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, categoryId: fd.get("categoryId"), budgetMode: mode, budget, budgetMin, budgetMax, deadline: deadlineStr, language: lang, skills: "" }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setServerError(data.error || `HTTP ${res.status}`); return; }
      setCreatedId(data.id);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Network error");
    } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={close} title={t.create.title}>
      {!user ? <AuthPrompt message={t.create.needLogin} /> :
       user.role !== "CLIENT" ? <p role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{t.create.onlyClient}</p> :
       createdId ? (
        <div className="text-center" role="status">
          <CheckCircle2 className="mx-auto h-12 w-12 text-brand-600" />
          <p className="mt-3 font-semibold text-ink">{t.create.success}</p>
          <Link href={`/projects/${createdId}`} onClick={close} className="btn-primary mt-5 w-full no-underline">{t.proposal.view}</Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <label htmlFor="cp-title" className="label">{t.create.name}</label>
            <input id="cp-title" name="title" className="input" aria-invalid={!!errors.title} aria-describedby="cp-title-err" />
            {errors.title && <p id="cp-title-err" className="field-error">{errors.title}</p>}
          </div>
          <div>
            <label htmlFor="cp-desc" className="label">{t.create.desc}</label>
            <textarea id="cp-desc" name="description" rows={4} className="input" aria-invalid={!!errors.description} aria-describedby="cp-desc-err" />
            {errors.description && <p id="cp-desc-err" className="field-error">{errors.description}</p>}
          </div>
          <div>
            <label htmlFor="cp-cat" className="label">{t.create.category}</label>
            <select id="cp-cat" name="categoryId" className="input" required>{cats.map((c) => <option key={c.id} value={c.id}>{lang === "ru" ? c.nameRu : lang === "en" ? c.nameEn : c.nameTj}</option>)}</select>
          </div>
          <fieldset>
            <legend className="label">{t.pf.budgetMode}</legend>
            <div role="radiogroup" className="mb-3 inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(["fixed", "range"] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`min-h-[36px] rounded-lg px-4 text-sm font-semibold transition duration-200 ${mode === m ? "bg-white text-brand-700 shadow dark:bg-slate-700 dark:text-white" : "text-ink-muted"}`}>{t.pf[m]}</button>)}
            </div>
            {mode === "fixed" ? (
              <div>
                <label htmlFor="cp-budget" className="label">{t.create.budget}</label>
                <input id="cp-budget" name="budget" type="number" inputMode="numeric" min={1} className="input" aria-invalid={!!errors.budget} aria-describedby="cp-budget-err" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="cp-bmin" className="label">{t.pf.budgetMin}</label><input id="cp-bmin" name="budgetMin" type="number" inputMode="numeric" min={1} className="input" aria-invalid={!!errors.budget} aria-describedby="cp-budget-err" /></div>
                <div><label htmlFor="cp-bmax" className="label">{t.pf.budgetMax}</label><input id="cp-bmax" name="budgetMax" type="number" inputMode="numeric" min={1} className="input" aria-invalid={!!errors.budget} aria-describedby="cp-budget-err" /></div>
              </div>
            )}
            {errors.budget && <p id="cp-budget-err" className="field-error">{errors.budget}</p>}
          </fieldset>
          <div>
              <label htmlFor="cp-deadline" className="label">{t.create.deadline}</label>
              <input id="cp-deadline" name="deadline" type="date" className="input" aria-invalid={!!errors.deadline} aria-describedby="cp-deadline-err" />
              {errors.deadline && <p id="cp-deadline-err" className="field-error">{errors.deadline}</p>}
          </div>
          {serverError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{serverError}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} className="btn-secondary">{t.create.cancel}</button>
            <button type="submit" disabled={loading} className="btn-primary"><Rocket className="h-4 w-4" />{loading ? t.create.sending : t.create.submit}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
