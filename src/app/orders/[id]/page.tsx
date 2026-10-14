import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Calendar, CheckCircle2, Info, Lock, MessageCircle, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDict, getLang } from "@/i18n/server";
import { fdate, fdatetime, fmt, money } from "@/i18n/format";
import { roleInOrder, canReview } from "@/lib/domain/authz";
import { availableMilestoneActions, canEditMilestones, localizeMilestoneTitle, type MilestoneStatus, type OrderStatus } from "@/lib/domain/workflow";
import StatusBadge from "@/components/StatusBadge";
import Avatar from "@/components/Avatar";
import Stars from "@/components/Stars";
import ActionButton from "@/components/ui/ActionButton";
import MilestoneForm from "@/components/order/MilestoneForm";
import SubmitWork from "@/components/order/SubmitWork";
import ReviewForm from "@/components/ReviewForm";
import ReportButton from "@/components/ReportButton";
import { AttachmentList } from "@/components/ui/FileUploader";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().ord.title }; }

export default async function OrderPage({ params }: { params: { id: string } }) {
  const t = getDict(); const lang = getLang();
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/orders/${params.id}`);
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { id: true, title: true } }, client: true, freelancer: true, conversation: { select: { id: true } },
      milestones: { orderBy: [{ position: "asc" }, { createdAt: "asc" }], include: { submissions: { orderBy: { createdAt: "desc" }, include: { attachments: true, author: { select: { name: true } } } }, events: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } } } },
      reviews: { include: { fromUser: { select: { name: true, avatarUrl: true } } } },
    },
  });
  // Privacy: non-participants get a 404 (admins may view for moderation).
  if (!order) notFound();
  const role = roleInOrder(user, order);
  if (!role && !user.isAdmin) notFound();
  const status = order.status as OrderStatus;
  const reviewCheck = canReview(user, order, order.reviews);

  const ev = (a: string) => (t.ord as Record<string, string>)[`ev_${a}`] ?? a;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="card shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{t.ord.title}</p>
            <h1 className="mt-1 break-words text-2xl font-extrabold text-ink"><Link href={`/projects/${order.project.id}`} className="no-underline hover:text-brand-700">{order.project.title}</Link></h1>
          </div>
          <span data-testid="order-status"><StatusBadge status={status} /></span>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
          <div className="flex gap-2"><Wallet className="h-4 w-4 text-brand-600" aria-hidden /><div><dt className="text-xs text-ink-muted">{t.ord.price}</dt><dd className="font-semibold">{money(order.price, t)}</dd></div></div>
          <div className="flex gap-2"><Calendar className="h-4 w-4 text-brand-600" aria-hidden /><div><dt className="text-xs text-ink-muted">{t.ord.deadline}</dt><dd className="font-semibold">{fdate(order.deadline, lang)}</dd></div></div>
          {[["client", order.client], ["freelancer", order.freelancer]].map(([k, u]) => { const x = u as typeof order.client; return (
            <div key={k as string} className="flex items-center gap-2"><Avatar name={x.name} src={x.avatarUrl} size="sm" /><div><dt className="text-xs text-ink-muted">{t.ord[k as "client"]}</dt><dd className="font-semibold"><Link href={`/freelancers/${x.id}`} className="no-underline">{x.name}</Link></dd></div></div>); })}
        </dl>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-ink-muted"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{t.ord.privacy} {t.common.noPayments}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {order.conversation && role && <Link href={`/messages/${order.conversation.id}`} className="btn-secondary no-underline"><MessageCircle className="h-4 w-4" aria-hidden />{t.ord.chat}</Link>}
          {role === "FREELANCER" && status === "NEGOTIATION" && <ActionButton url={`/api/orders/${order.id}`} body={{ action: "start" }} label={t.ord.start} className="btn-primary" testId="order-start" />}
          {role === "CLIENT" && !["COMPLETED", "CANCELLED"].includes(status) && <ActionButton url={`/api/orders/${order.id}`} body={{ action: "cancel" }} label={t.ord.cancelOrder} className="btn-secondary !text-rose-600" confirm={t.ord.cancelConfirm} prompt={{ label: t.common.reason, field: "reason" }} />}
        </div>
        {status === "NEGOTIATION" && <p className="mt-3 flex items-start gap-2 text-sm text-purple-700"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{role === "FREELANCER" ? t.ord.startHint : t.ord.negotiationHint}</p>}
        {status === "COMPLETED" && <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-brand-700"><CheckCircle2 className="h-4 w-4" aria-hidden />{t.ord.completedNote}</p>}
        {status === "CANCELLED" && <p className="mt-3 text-sm text-rose-700">{t.ord.cancelledNote}</p>}
      </div>

      <section aria-labelledby="ms-h" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="ms-h" className="text-lg font-bold text-ink">{t.ord.milestones}</h2>
          {role === "CLIENT" && canEditMilestones("CLIENT", status) && <MilestoneForm orderId={order.id} />}
        </div>
        {status !== "CANCELLED" && (() => {
          const steps = ["NEGOTIATION", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"];
          const cur = Math.max(0, steps.indexOf(status === "REVISION_REQUESTED" ? "IN_PROGRESS" : status));
          return (
            <ol className="card flex items-center gap-1 !p-3 sm:!p-4" aria-label={t.common.status}>
              {steps.map((st, k) => (
                <li key={st} className="flex flex-1 items-center gap-1" aria-current={k === cur ? "step" : undefined}>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${k < cur ? "bg-brand-600 text-white" : k === cur ? "bg-brand-50 text-brand-700 ring-2 ring-brand-500" : "bg-slate-100 text-slate-400"}`}>{k < cur ? "✓" : k + 1}</span>
                  <span className={`hidden truncate text-xs font-semibold sm:block ${k <= cur ? "text-ink" : "text-ink-muted"}`}><StatusBadge status={st} /></span>
                  {k < steps.length - 1 && <span className={`mx-1 h-0.5 flex-1 rounded-full ${k < cur ? "bg-brand-500" : "bg-slate-200"}`} aria-hidden />}
                </li>
              ))}
            </ol>
          );
        })()}
        <ol className="relative space-y-3 pl-9 before:absolute before:bottom-4 before:left-[13px] before:top-4 before:w-0.5 before:rounded-full before:bg-gradient-to-b before:from-brand-400 before:to-slate-200" data-testid="milestones">
          {order.milestones.map((m, i) => {
            const acts = role ? availableMilestoneActions(role, m.status as MilestoneStatus, status) : [];
            return (
              <li key={m.id} className="card relative" data-testid={`ms-${i}`}>
                <span className={`absolute -left-9 top-5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white dark:ring-slate-950 ${m.status === "ACCEPTED" ? "bg-brand-600 text-white" : m.status === "SUBMITTED" ? "bg-sky-500 text-white" : m.status === "CANCELLED" ? "bg-slate-300 text-white" : m.status === "REVISION_REQUESTED" ? "bg-amber-500 text-white" : "bg-white text-brand-700 ring-brand-100 border-2 border-brand-500 dark:bg-slate-900"}`} aria-hidden>{m.status === "ACCEPTED" ? "✓" : i + 1}</span>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink">{i + 1}. {localizeMilestoneTitle(m.title, lang)}</h3>
                    {m.description && <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">{m.description}</p>}
                    <p className="mt-1 text-xs text-ink-muted">{t.ord.mDeadline}: {fdate(m.deadline, lang)}{m.amount != null && ` · ${money(m.amount, t)}`}</p>
                  </div>
                  <span data-testid="ms-status"><StatusBadge status={m.status} /></span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {role === "CLIENT" && canEditMilestones("CLIENT", status) && ["PENDING", "IN_PROGRESS"].includes(m.status) && <MilestoneForm orderId={order.id} milestone={{ id: m.id, title: m.title, description: m.description, deadline: m.deadline.toISOString(), amount: m.amount }} />}
                  {acts.includes("start") && status !== "NEGOTIATION" && <ActionButton url={`/api/milestones/${m.id}`} body={{ action: "start" }} label={t.ord.start} />}
                  {acts.includes("submit") && <SubmitWork milestoneId={m.id} />}
                  {acts.includes("accept") && <ActionButton url={`/api/milestones/${m.id}`} body={{ action: "accept" }} label={t.ord.accept} className="btn-primary" confirm={t.ord.accept + "?"} testId="ms-accept" />}
                  {acts.includes("requestRevision") && <ActionButton url={`/api/milestones/${m.id}`} body={{ action: "requestRevision" }} label={t.ord.revision} prompt={{ label: t.ord.revisionComment, field: "comment" }} testId="ms-revision" />}
                  {acts.includes("cancel") && <ActionButton url={`/api/milestones/${m.id}`} body={{ action: "cancel" }} label={t.ord.cancelMilestone} className="btn-ghost !text-rose-600" confirm={t.ord.cancelMilestone + "?"} />}
                </div>
                {m.submissions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase text-ink-muted">{t.ord.submissions}</h4>
                    {m.submissions.map((s) => (
                      <div key={s.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                        <p className="text-xs text-ink-muted">{s.author.name} · {fdatetime(s.createdAt, lang)}</p>
                        {s.message && <p className="mt-1 whitespace-pre-line">{s.message}</p>}
                        <div className="mt-2"><AttachmentList files={s.attachments.map((a) => ({ id: a.id, name: a.name, mimeType: a.mimeType, url: `/api/files/${a.id}` }))} /></div>
                      </div>
                    ))}
                  </div>
                )}
                {m.events.length > 0 && (
                  <details className="mt-3 text-sm">
                    <summary className="min-h-[36px] cursor-pointer text-xs font-semibold text-ink-muted">{t.ord.history} ({m.events.length})</summary>
                    <ul className="mt-2 space-y-1 border-l-2 border-line pl-3 text-xs">
                      {m.events.map((e) => <li key={e.id}><span className="text-ink-muted">{fdatetime(e.createdAt, lang)}</span> — <strong>{e.actor.name}</strong>: {ev(e.action)}{e.comment && <> — <em>{e.comment}</em></>}</li>)}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="rv-h" className="space-y-3">
        <h2 id="rv-h" className="text-lg font-bold text-ink">{t.ord.reviews}</h2>
        {order.reviews.filter((r) => !r.hidden).map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><Avatar name={r.fromUser.name} src={r.fromUser.avatarUrl} size="sm" /><strong>{r.fromUser.name}</strong></span><Stars value={r.rating} /></div>
            <p className="mt-2 text-sm text-ink-muted">{r.comment}</p>
            <div className="flex justify-end"><ReportButton targetType="REVIEW" targetId={r.id} /></div>
          </div>
        ))}
        {reviewCheck.ok ? <ReviewForm orderId={order.id} /> : status !== "COMPLETED" && role ? <p className="text-sm text-ink-muted">{t.rev.noReviewsHint}</p> : null}
      </section>
    </div>
  );
}
