import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, CheckCircle2, FileText, MessageCircle, Tag, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { avgRating, getCurrentUser } from "@/lib/auth";
import { formatDate, formatMoney, parseSkills, statusLabel } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import Stars from "@/components/Stars";
import Avatar from "@/components/Avatar";
import ProposalForm from "@/components/ProposalForm";
import AcceptProposalButton from "@/components/AcceptProposalButton";
import CompleteProjectButton from "@/components/CompleteProjectButton";
import ReviewForm from "@/components/ReviewForm";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      client: { include: { reviewsRecv: true } },
      attachments: true,
      proposals: {
        include: {
          freelancer: {
            include: { profile: true, reviewsRecv: true },
          },
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      },
      reviews: { include: { fromUser: true, toUser: true } },
    },
  });
  if (!project) notFound();

  const isClient = user?.id === project.clientId;
  const myProposal = user
    ? project.proposals.find((p) => p.freelancerId === user.id)
    : null;
  const accepted = project.proposals.find((p) => p.status === "ACCEPTED");
  const isAcceptedFreelancer = accepted && user?.id === accepted.freelancerId;
  const canChat =
    project.status !== "OPEN" && (isClient || isAcceptedFreelancer);
  const myReview = user
    ? project.reviews.find((r) => r.fromUserId === user.id)
    : null;
  const canReview =
    project.status === "COMPLETED" &&
    (isClient || isAcceptedFreelancer) &&
    !myReview;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="card shadow-soft overflow-hidden !p-0">
        <div className="bg-gradient-to-r from-brand-600/10 via-accent-500/10 to-transparent px-6 py-5 dark:from-brand-500/20 dark:via-accent-500/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {project.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-2">
                  <Avatar name={project.client.name} src={project.client.avatarUrl} size="sm" />
                  <span>
                    Мизоҷ: <strong>{project.client.name}</strong>
                  </span>
                </span>
                <Stars
                  value={avgRating(project.client.reviewsRecv)}
                  count={project.client.reviewsRecv.length}
                />
              </div>
            </div>
            <StatusBadge status={project.status} />
          </div>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-brand-700 dark:text-brand-300">
              <Wallet className="h-4 w-4" />
              {formatMoney(project.budget)}
            </span>
            <span className="inline-flex items-center gap-1.5 muted">
              <Tag className="h-4 w-4" />
              {project.category}
            </span>
            <span className="inline-flex items-center gap-1.5 muted">
              <Calendar className="h-4 w-4" />
              {formatDate(project.deadline)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {parseSkills(project.skills).map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
          {project.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {project.attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {a.name}
                </a>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            {canChat && (
              <Link
                href={`/projects/${project.id}/chat`}
                className="btn-primary no-underline"
              >
                <MessageCircle className="h-4 w-4" />
                Чат
              </Link>
            )}
            {isClient && project.status === "IN_PROGRESS" && (
              <CompleteProjectButton projectId={project.id} />
            )}
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold">
          Пешниҳодҳо ({project.proposals.length})
        </h2>
        <div className="space-y-3">
          {project.proposals.map((p) => (
            <div key={p.id} className="card-hover !hover:translate-y-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={p.freelancer.name} src={p.freelancer.avatarUrl} />
                  <div>
                    <Link
                      href={`/freelancers/${p.freelancerId}`}
                      className="font-bold"
                    >
                      {p.freelancer.name}
                    </Link>
                    <div className="text-sm muted">
                      {p.freelancer.profile?.title}
                    </div>
                    <Stars
                      value={avgRating(p.freelancer.reviewsRecv)}
                      count={p.freelancer.reviewsRecv.length}
                    />
                  </div>
                </div>
                <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {statusLabel(p.status)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {p.coverLetter}
              </p>
              {p.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
                    >
                      <FileText className="h-3 w-3" />
                      {a.name}
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <span className="font-bold text-brand-600">
                  {formatMoney(p.price)}
                </span>
                <span className="muted">{p.deliveryDays} рӯз</span>
                {isClient &&
                  project.status === "OPEN" &&
                  p.status === "PENDING" && (
                    <AcceptProposalButton
                      projectId={project.id}
                      proposalId={p.id}
                    />
                  )}
              </div>
            </div>
          ))}
          {!project.proposals.length && (
            <p className="card text-center muted">Ҳанӯз пешниҳод нест.</p>
          )}
        </div>

        {user?.role === "FREELANCER" &&
          project.status === "OPEN" &&
          !myProposal && <ProposalForm projectId={project.id} />}
        {myProposal && project.status === "OPEN" && (
          <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Шумо аллакай пешниҳод додаед ({statusLabel(myProposal.status)}).
          </p>
        )}
      </section>

      {project.status === "COMPLETED" && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Баҳоҳо</h2>
          <div className="space-y-3">
            {project.reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 font-medium">
                    <Avatar name={r.fromUser.name} size="sm" />
                    {r.fromUser.name} → {r.toUser.name}
                  </span>
                  <Stars value={r.rating} />
                </div>
                <p className="mt-2 text-sm muted">{r.comment}</p>
              </div>
            ))}
          </div>
          {canReview && <ReviewForm projectId={project.id} />}
        </section>
      )}
    </div>
  );
}
