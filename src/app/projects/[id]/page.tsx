import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, Languages, MapPin, Pencil, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { avgRating, getCurrentUser } from "@/lib/auth";
import { parseSkills } from "@/lib/utils";
import { getDict, getLang } from "@/i18n/server";
import { fdate, fmt, money, moneyRange } from "@/i18n/format";
import { catName } from "@/lib/queries/projects";
import StatusBadge from "@/components/StatusBadge";
import Stars from "@/components/Stars";
import Avatar from "@/components/Avatar";
import ActionButton from "@/components/ui/ActionButton";
import { ProposalButton } from "@/components/ProposalModal";
import ProposalsOwnerList from "@/components/ProposalsOwnerList";
import ReportButton from "@/components/ReportButton";
import { AttachmentList } from "@/components/ui/FileUploader";
import BookmarkButton from "@/components/BookmarkButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = await prisma.project.findUnique({ where: { id: params.id }, select: { title: true, hidden: true, status: true } });
  return { title: p && !p.hidden && p.status !== "DRAFT" ? p.title : getDict().errors.not_found };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const t = getDict(); const lang = getLang();
  const user = await getCurrentUser();
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      client: { include: { reviewsRecv: true, _count: { select: { projects: true } } } },
      categoryRel: true, skillsRel: true,
      attachments: { where: { proposalId: null, messageId: null, submissionId: null } },
      order: { select: { id: true, clientId: true, freelancerId: true } },
      _count: { select: { proposals: { where: { status: { not: "WITHDRAWN" } } } } },
    },
  });
  if (!project) notFound();
  const isOwner = user?.id === project.clientId;
  const isAdmin = !!user?.isAdmin;
  // Drafts and hidden projects are visible only to their owner (and admins).
  if ((project.status === "DRAFT" || project.hidden) && !isOwner && !isAdmin) notFound();

  const ownerProposals = isOwner
    ? await prisma.proposal.findMany({ where: { projectId: project.id, status: { not: "WITHDRAWN" } }, orderBy: { createdAt: "asc" }, include: { attachments: true, freelancer: { include: { profile: true, reviewsRecv: true } } } })
    : [];
  const mine = user && !isOwner ? await prisma.proposal.findUnique({ where: { projectId_freelancerId: { projectId: project.id, freelancerId: user.id } }, include: { portfolioItems: { select: { id: true } }, attachments: true } }) : null;
  const isParticipant = project.order && (project.order.clientId === user?.id || project.order.freelancerId === user?.id);
  const skills = project.skillsRel.length ? project.skillsRel.map((s) => s.name) : parseSkills(project.skills);
  const propOpen = project.status === "OPEN" && (!project.proposalDeadline || project.proposalDeadline >= new Date(new Date().toDateString()));
  const pmini = { id: project.id, title: project.title, budget: project.budgetMax ?? project.budget };

  const facts = [
    { icon: Wallet, label: t.pd.budget, value: moneyRange(project, t) },
    { icon: Calendar, label: t.pd.deadline, value: fdate(project.deadline, lang) },
    { icon: Clock, label: t.pd.proposalDeadline, value: fdate(project.proposalDeadline, lang) },
    { icon: Languages, label: t.pd.language, value: t.pl[`lang_${(project.language || "tj") as "tj"}`] ?? project.language },
    { icon: MapPin, label: t.pd.city, value: project.city },
    { icon: Users, label: t.pd.proposalsCount, value: String(project._count.proposals) },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {project.status === "DRAFT" && <p role="status" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{t.pd.draftNotice}</p>}
      {project.hidden && <p role="status" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{t.pd.hiddenNotice}</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <article className="card shadow-soft min-w-0 overflow-hidden !p-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.coverUrl || "/img/covers/website.svg"} alt="" className="block h-48 w-full object-cover sm:h-64" />
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{catName(project.categoryRel, lang, project.category)}</p>
                <h1 className="mt-1 break-words text-2xl font-extrabold tracking-tight text-ink sm:text-3xl" data-testid="project-title">{project.title}</h1>
                <p className="mt-1 text-xs text-ink-muted">{t.pd.posted}: {fdate(project.publishedAt || project.createdAt, lang)}</p>
              </div>
              <div className="flex items-center gap-2"><StatusBadge status={project.status} /><BookmarkButton id={project.id} /></div>
            </div>
            <p className="whitespace-pre-line break-words leading-relaxed text-ink-muted">{project.description}</p>
            {skills.length > 0 && <ul className="flex flex-wrap gap-2" aria-label={t.pf.skills}>{skills.map((s) => <li key={s} className="chip">{s}</li>)}</ul>}
            <AttachmentList files={project.attachments.map((a) => ({ id: a.id, name: a.name, mimeType: a.mimeType, url: a.visibility === "PUBLIC" && a.url ? a.url : `/api/files/${a.id}` }))} />
            <div className="flex justify-end"><ReportButton targetType="PROJECT" targetId={project.id} /></div>
          </div>
        </article>

        <aside className="space-y-4">
          <div className="card">
            <dl className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-1">
              {facts.map((f) => (
                <div key={f.label} className="flex items-start gap-2"><f.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden /><div><dt className="text-xs text-ink-muted">{f.label}</dt><dd className="font-semibold text-ink">{f.value}</dd></div></div>
              ))}
            </dl>
            <div className="mt-5 space-y-2">
              {isOwner ? (
                <>
                  <Link href={`/projects/${project.id}/edit`} className="btn-secondary w-full no-underline"><Pencil className="h-4 w-4" aria-hidden />{t.pd.editProject}</Link>
                  {project.status === "DRAFT" && <ActionButton url={`/api/projects/${project.id}`} method="PATCH" body={{ action: "publish" }} label={t.dash.publish} className="btn-primary w-full" testId="publish" />}
                  {project.status === "OPEN" && <ActionButton url={`/api/projects/${project.id}`} method="PATCH" body={{ action: "close" }} label={t.dash.close} className="btn-secondary w-full" confirm={t.dash.close + "?"} />}
                </>
              ) : mine && mine.status !== "WITHDRAWN" ? (
                <div className="rounded-2xl bg-brand-50 p-4 text-sm" data-testid="my-proposal">
                  <div className="mb-2 flex items-center justify-between"><strong>{t.pd.yourProposal}</strong><StatusBadge status={mine.status} /></div>
                  <p>{money(mine.price, t)} · {fmt(t.pd.delivery, { n: mine.deliveryDays })}</p>
                  <p className="mt-2 line-clamp-4 whitespace-pre-line text-ink-muted">{mine.coverLetter}</p>
                  {mine.status === "SENT" && propOpen && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ProposalButton project={pmini} label={t.common.edit} className="btn-secondary" existing={{ id: mine.id, price: mine.price, deliveryDays: mine.deliveryDays, coverLetter: mine.coverLetter, portfolioIds: mine.portfolioItems.map((p) => p.id) }} />
                      <ActionButton url={`/api/proposals/${mine.id}`} method="PATCH" body={{ action: "withdraw" }} label={t.pd.withdraw} confirm={t.pd.withdrawConfirm} className="btn-secondary" testId="withdraw" />
                    </div>
                  )}
                </div>
              ) : propOpen ? (
                <ProposalButton project={pmini} label={mine ? t.pd.resend : t.pd.propose} className="btn-primary w-full" />
              ) : project.status !== "DRAFT" && <p className="rounded-2xl bg-slate-50 p-3 text-sm text-ink-muted">{t.pd.closedNotice}</p>}
              {isParticipant && project.order && <Link href={`/orders/${project.order.id}`} className="btn-primary w-full no-underline" data-testid="go-order">{t.pd.goOrder}</Link>}
            </div>
          </div>
          <div className="card">
            <h2 className="mb-3 text-sm font-bold text-ink-muted">{t.pd.client}</h2>
            <Link href={`/freelancers/${project.client.id}`} className="flex items-center gap-3 no-underline">
              <Avatar name={project.client.name} src={project.client.avatarUrl} size="md" />
              <span><span className="block font-semibold text-ink">{project.client.name}</span><Stars value={avgRating(project.client.reviewsRecv)} count={project.client.reviewsRecv.filter((r) => !r.hidden).length} /></span>
            </Link>
            <p className="mt-2 text-xs text-ink-muted">{fmt(t.pd.clientProjects, { n: project.client._count.projects })}</p>
          </div>
        </aside>
      </div>

      {isOwner && (
        <section className="card" aria-labelledby="props-h">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="props-h" className="text-lg font-bold text-ink">{t.pd.proposalsCount} ({ownerProposals.length})</h2>
            <span className="text-xs text-ink-muted">{t.pd.onlyOwner}</span>
          </div>
          {ownerProposals.length ? (
            <ProposalsOwnerList projectId={project.id} canHire={project.status === "OPEN"} proposals={ownerProposals.map((p) => ({
              id: p.id, price: p.price, deliveryDays: p.deliveryDays, coverLetter: p.coverLetter, status: p.status,
              freelancer: { id: p.freelancer.id, name: p.freelancer.name, avatarUrl: p.freelancer.avatarUrl, title: p.freelancer.profile?.title || "" },
              rating: avgRating(p.freelancer.reviewsRecv), reviews: p.freelancer.reviewsRecv.filter((r) => !r.hidden).length,
              attachments: p.attachments.map((a) => ({ id: a.id, name: a.name, mimeType: a.mimeType, url: `/api/files/${a.id}` })),
            }))} />
          ) : <p className="text-sm text-ink-muted">{t.pd.noProposalsYet}</p>}
        </section>
      )}
    </div>
  );
}
