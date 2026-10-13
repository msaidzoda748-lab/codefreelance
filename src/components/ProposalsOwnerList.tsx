"use client";
import Link from "next/link";
import { Clock } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt } from "@/i18n/format";
import { money } from "@/i18n/format";
import Avatar from "./Avatar";
import Stars from "./Stars";
import StatusBadge from "./StatusBadge";
import ActionButton from "./ui/ActionButton";
import CompareList from "./CompareBar";
import { AttachmentList } from "./ui/FileUploader";

export type OwnerProposal = { id: string; price: number; deliveryDays: number; coverLetter: string; status: string; freelancer: { id: string; name: string; avatarUrl: string | null; title: string }; rating: number | null; reviews: number; attachments: { id: string; name: string; url: string; mimeType: string }[] };

export default function ProposalsOwnerList({ projectId, proposals, canHire }: { projectId: string; proposals: OwnerProposal[]; canHire: boolean }) {
  const { t } = useI18n();
  return (
    <CompareList projectId={projectId}>
      {(sel, toggle) => (
        <ul className="space-y-3" data-testid="owner-proposals">
          {proposals.map((p) => (
            <li key={p.id} className="rounded-2xl border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link href={`/freelancers/${p.freelancer.id}`} className="flex items-center gap-3 no-underline">
                  <Avatar name={p.freelancer.name} src={p.freelancer.avatarUrl} size="md" />
                  <span><span className="block font-semibold text-ink">{p.freelancer.name}</span><span className="block text-xs text-ink-muted">{p.freelancer.title}</span><Stars value={p.rating} count={p.reviews} /></span>
                </Link>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-brand-600">{money(p.price, t)}</div>
                  <div className="inline-flex items-center gap-1 text-xs text-ink-muted"><Clock className="h-3.5 w-3.5" aria-hidden />{fmt(t.pd.delivery, { n: p.deliveryDays })}</div>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-ink-muted">{p.coverLetter}</p>
              <div className="mt-2"><AttachmentList files={p.attachments} /></div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StatusBadge status={p.status} />
                {p.status === "SENT" && (
                  <label className="inline-flex min-h-[44px] items-center gap-2 text-sm">
                    <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={sel.includes(p.id)} disabled={!sel.includes(p.id) && sel.length >= 3} onChange={() => toggle(p.id)} data-testid={`cmp-${p.id}`} />{t.pd.compareSelect}
                  </label>
                )}
                {canHire && p.status === "SENT" && (
                  <ActionButton url={`/api/projects/${projectId}/accept`} body={{ proposalId: p.id }} label={t.pd.hire} className="btn-primary ml-auto" confirm={fmt(t.pd.hireConfirm, { name: p.freelancer.name })} testId={`hire-${p.id}`} redirect={(d) => (d.orderId ? `/orders/${d.orderId}` : null)} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </CompareList>
  );
}
