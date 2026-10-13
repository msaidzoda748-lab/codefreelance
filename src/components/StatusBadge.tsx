"use client";
import { useI18n } from "@/i18n/I18nProvider";

const TONE: Record<string, string> = {
  OPEN: "bg-brand-50 text-brand-700 ring-brand-100", SENT: "bg-sky-50 text-sky-700 ring-sky-100", NEGOTIATION: "bg-purple-50 text-purple-700 ring-purple-100",
  IN_PROGRESS: "bg-amber-50 text-amber-800 ring-amber-100", IN_REVIEW: "bg-sky-50 text-sky-700 ring-sky-100", SUBMITTED: "bg-sky-50 text-sky-700 ring-sky-100",
  REVISION_REQUESTED: "bg-orange-50 text-orange-700 ring-orange-100", ACCEPTED: "bg-brand-50 text-brand-700 ring-brand-100", COMPLETED: "bg-brand-600 text-white ring-brand-600",
  RESOLVED: "bg-brand-50 text-brand-700 ring-brand-100", ACTIVE: "bg-brand-50 text-brand-700 ring-brand-100",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-100", CANCELLED: "bg-rose-50 text-rose-700 ring-rose-100", RESTRICTED: "bg-rose-50 text-rose-700 ring-rose-100",
};
export default function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const label = (t.status as Record<string, string>)[status] ?? status;
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${TONE[status] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}>{label}</span>;
}
