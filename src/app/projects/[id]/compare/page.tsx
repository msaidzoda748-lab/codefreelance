import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { avgRating, getCurrentUser } from "@/lib/auth";
import { getDict } from "@/i18n/server";
import { fmt, money } from "@/i18n/format";
import { parseSkills } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import Stars from "@/components/Stars";
import StatusBadge from "@/components/StatusBadge";
import ActionButton from "@/components/ui/ActionButton";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().cmp.title }; }

export default async function ComparePage({ params, searchParams }: { params: { id: string }; searchParams: { ids?: string } }) {
  const t = getDict();
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/projects/${params.id}`);
  const project = await prisma.project.findUnique({ where: { id: params.id }, select: { id: true, title: true, clientId: true, status: true } });
  // Proposal contents are visible only to the project owner.
  if (!project || project.clientId !== user.id) notFound();
  const ids = (searchParams.ids || "").split(",").filter(Boolean).slice(0, 3);
  const props = await prisma.proposal.findMany({
    where: { id: { in: ids }, projectId: project.id, status: { not: "WITHDRAWN" } },
    include: { portfolioItems: true, freelancer: { include: { profile: { include: { skillsRel: true } }, reviewsRecv: true, _count: { select: { freelancerOrders: { where: { status: "COMPLETED" } } } } } } },
  });
  if (props.length < 2) return <div className="card"><p>{t.cmp.pick}</p><Link href={`/projects/${project.id}`} className="btn-secondary mt-4 no-underline">{t.common.back}</Link></div>;
  const minPrice = Math.min(...props.map((p) => p.price)), minDays = Math.min(...props.map((p) => p.deliveryDays));
  const rows = props.map((p) => ({ p, rating: avgRating(p.freelancer.reviewsRecv), skills: p.freelancer.profile?.skillsRel.length ? p.freelancer.profile.skillsRel.map((s) => s.name) : parseSkills(p.freelancer.profile?.skills || "") }));
  const best = <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-brand-50 px-1.5 text-[10px] font-bold text-brand-700"><Trophy className="h-3 w-3" aria-hidden />{t.cmp.best}</span>;
  return (
    <div className="space-y-5 animate-slide-up">
      <Link href={`/projects/${project.id}`} className="inline-flex min-h-[44px] items-center gap-1 text-sm no-underline"><ArrowLeft className="h-4 w-4" aria-hidden />{project.title}</Link>
      <h1 className="text-2xl font-extrabold text-ink">{t.cmp.title}</h1>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white" data-testid="compare-table">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">{t.cmp.title}</caption>
          <thead><tr className="border-b border-line"><th scope="col" className="w-36 p-4" />{rows.map(({ p }) => (
            <th key={p.id} scope="col" className="p-4 align-top"><div className="flex items-center gap-2"><Avatar name={p.freelancer.name} src={p.freelancer.avatarUrl} size="sm" /><Link href={`/freelancers/${p.freelancer.id}`} className="font-bold no-underline">{p.freelancer.name}</Link></div><div className="mt-1"><StatusBadge status={p.status} /></div></th>))}</tr></thead>
          <tbody className="divide-y divide-line">
            <tr><th scope="row" className="p-4 text-ink-muted">{t.cmp.price}</th>{rows.map(({ p }) => <td key={p.id} className="p-4 font-bold text-brand-700">{money(p.price, t)}{p.price === minPrice && best}</td>)}</tr>
            <tr><th scope="row" className="p-4 text-ink-muted">{t.cmp.time}</th>{rows.map(({ p }) => <td key={p.id} className="p-4">{fmt(t.pd.delivery, { n: p.deliveryDays })}{p.deliveryDays === minDays && best}</td>)}</tr>
            <tr><th scope="row" className="p-4 text-ink-muted">{t.cmp.rating}</th>{rows.map(({ p, rating }) => <td key={p.id} className="p-4"><Stars value={rating} /></td>)}</tr>
            <tr><th scope="row" className="p-4 text-ink-muted">{t.cmp.completed}</th>{rows.map(({ p }) => <td key={p.id} className="p-4">{p.freelancer._count.freelancerOrders}</td>)}</tr>
            <tr><th scope="row" className="p-4 text-ink-muted">{t.cmp.skills}</th>{rows.map(({ p, skills }) => <td key={p.id} className="p-4"><div className="flex flex-wrap gap-1">{skills.slice(0, 8).map((s) => <span key={s} className="chip">{s}</span>)}</div></td>)}</tr>
            <tr><th scope="row" className="p-4 text-ink-muted">{t.cmp.portfolio}</th>{rows.map(({ p }) => <td key={p.id} className="p-4">{p.portfolioItems.length ? <ul className="list-disc pl-4">{p.portfolioItems.map((i) => <li key={i.id}>{i.link ? <a href={i.link} target="_blank" rel="noreferrer">{i.title}</a> : i.title}</li>)}</ul> : "—"}</td>)}</tr>
            <tr><th scope="row" className="p-4 align-top text-ink-muted">{t.cmp.letter}</th>{rows.map(({ p }) => <td key={p.id} className="whitespace-pre-line p-4 align-top text-ink-muted">{p.coverLetter}</td>)}</tr>
            {project.status === "OPEN" && <tr><td />{rows.map(({ p }) => <td key={p.id} className="p-4">{p.status === "SENT" && <ActionButton url={`/api/projects/${project.id}/accept`} body={{ proposalId: p.id }} label={t.pd.hire} className="btn-primary w-full" confirm={t.pd.hireConfirm} testId={`cmp-hire-${p.id}`} redirectTo={{ key: "orderId", prefix: "/orders/" }} />}</td>)}</tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
