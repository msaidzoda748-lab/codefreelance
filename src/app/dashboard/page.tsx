import { localizeMilestoneTitle } from "@/lib/domain/workflow";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, Briefcase, CalendarClock, FileText, Inbox, MessageCircle, PlusCircle, Search, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { unreadCounts } from "@/lib/services/chat";
import { getDict, getLang } from "@/i18n/server";
import { fdate, fmt, money, moneyRange } from "@/i18n/format";
import StatusBadge from "@/components/StatusBadge";
import ActionButton from "@/components/ui/ActionButton";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().nav.dashboard }; }

const TONES = ["bg-brand-50 text-brand-700 ring-brand-100", "bg-sky-50 text-sky-700 ring-sky-100", "bg-purple-50 text-purple-700 ring-purple-100", "bg-amber-50 text-amber-700 ring-amber-100"];
function Stat({ icon: Icon, label, value, href, tone = 0, hint }: { icon: typeof Inbox; label: string; value: number; href?: string; tone?: number; hint?: string }) {
  const inner = (
    <>
      <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand-mesh opacity-80" aria-hidden />
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${TONES[tone % 4]}`}><Icon className="h-5 w-5" aria-hidden /></span>
      <span className="mt-3 block text-[28px] font-extrabold leading-none tracking-tight text-ink">{value}</span>
      <span className="mt-1 block text-xs font-medium text-ink-muted">{label}</span>
      {hint && value > 0 && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">↗ {hint}</span>}
    </>
  );
  return href ? <Link href={href} className="stat-card block no-underline">{inner}</Link> : <div className="stat-card">{inner}</div>;
}
function Section({ title, children, action, id }: { title: string; children: React.ReactNode; action?: React.ReactNode; id: string }) {
  return <section className="card" aria-labelledby={id}><div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-3 dark:border-slate-800"><h2 id={id} className="flex items-center gap-2 text-base font-bold text-ink"><span className="h-4 w-1 rounded-full bg-brand-500" aria-hidden />{title}</h2>{action}</div>{children}</section>;
}
const Empty = ({ text }: { text: string }) => <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-ink-muted"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500"><Inbox className="h-6 w-6" aria-hidden /></span>{text}</div>;

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  const t = getDict(); const lang = getLang();
  const isClient = user.role === "CLIENT";
  const unreadMap = await unreadCounts(user.id);
  const unread = Object.values(unreadMap).reduce((a, b) => a + b, 0);
  const other = isClient ? "FREELANCER" : "CLIENT";
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm text-ink-muted">{fmt(t.dash.hello, { name: user.name })}</p>
        <h1 className="page-title" data-testid="dash-title">{isClient ? t.dash.clientTitle : t.dash.freelancerTitle}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionButton url="/api/auth/switch-role" body={{ role: other }} label={`${t.account.switchTo}: ${other === "CLIENT" ? t.auth.client : t.auth.freelancer}`} className="btn-ghost" testId="switch-role" />
        {isClient ? <Link href="/projects/new" className="btn-primary no-underline"><PlusCircle className="h-4 w-4" aria-hidden />{t.dash.newProject}</Link>
          : <Link href="/projects" className="btn-primary no-underline"><Search className="h-4 w-4" aria-hidden />{t.dash.findWork}</Link>}
      </div>
    </div>
  );

  const orders = await prisma.order.findMany({
    where: isClient ? { clientId: user.id } : { freelancerId: user.id }, orderBy: { updatedAt: "desc" }, take: 20,
    include: { project: { select: { title: true } }, client: { select: { name: true } }, freelancer: { select: { name: true } }, reviews: { select: { fromUserId: true } }, milestones: { select: { status: true, deadline: true, title: true, id: true } } },
  });
  const toReview = orders.filter((o) => o.status === "COMPLETED" && !o.reviews.some((r) => r.fromUserId === user.id));
  const orderList = (
    <Section id="orders-h" title={t.dash.myOrders}>
      {orders.length ? <ul className="divide-y divide-line">{orders.map((o) => (
        <li key={o.id}><Link href={`/orders/${o.id}`} className="-mx-2 flex flex-wrap items-center justify-between gap-2 rounded-xl px-2 py-3 no-underline transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="min-w-0"><span className="block truncate font-semibold text-ink">{o.project.title}</span><span className="text-xs text-ink-muted">{isClient ? o.freelancer.name : o.client.name} · {money(o.price, t)} · {fdate(o.deadline, lang)}</span></span>
          <StatusBadge status={o.status} /></Link></li>))}</ul> : <Empty text={t.dash.noOrders} />}
    </Section>
  );
  const reviewList = toReview.length > 0 && (
    <Section id="rev-h" title={t.dash.toReview}>
      <ul className="space-y-2">{toReview.map((o) => <li key={o.id}><Link href={`/orders/${o.id}#rv-h`} className="flex items-center gap-2 text-sm"><Star className="h-4 w-4 text-amber-500" aria-hidden />{o.project.title}</Link></li>)}</ul>
    </Section>
  );

  if (isClient) {
    const projects = await prisma.project.findMany({ where: { clientId: user.id }, orderBy: { createdAt: "desc" }, take: 30, include: { _count: { select: { proposals: { where: { status: "SENT" } } } }, order: { select: { id: true } } } });
    const newProposals = projects.reduce((a, p) => a + (p.status === "OPEN" ? p._count.proposals : 0), 0);
    const awaiting = orders.reduce((a, o) => a + o.milestones.filter((m) => m.status === "SUBMITTED").length, 0);
    return (
      <div className="space-y-6 animate-slide-up">
        {header}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat tone={0} icon={Briefcase} label={t.dash.activeProjects} value={projects.filter((p) => ["OPEN", "IN_PROGRESS"].includes(p.status)).length} />
          <Stat tone={1} icon={Inbox} label={t.dash.newProposals} value={newProposals} />
          <Stat tone={2} icon={MessageCircle} label={t.dash.unread} value={unread} href="/messages" hint={t.common.view} />
          <Stat tone={3} icon={FileText} label={t.dash.awaitingReview} value={awaiting} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Section id="proj-h" title={t.dash.myProjects}>
            {projects.length ? <ul className="divide-y divide-line">{projects.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <Link href={`/projects/${p.id}`} className="min-w-0 no-underline"><span className="block truncate font-semibold text-ink">{p.title}</span><span className="text-xs text-ink-muted">{moneyRange(p, t)} · {fmt(t.dash.proposalsCount, { n: p._count.proposals })}</span></Link>
                <span className="flex items-center gap-2"><StatusBadge status={p.status} />{p.order && <Link href={`/orders/${p.order.id}`} className="text-xs">{t.dash.openOrder}</Link>}</span>
              </li>))}</ul> : <Empty text={t.dash.noProjects} />}
          </Section>
          <div className="space-y-6">{reviewList}{orderList}</div>
        </div>
      </div>
    );
  }

  const [proposals, saved] = await Promise.all([
    prisma.proposal.findMany({ where: { freelancerId: user.id }, orderBy: { updatedAt: "desc" }, take: 30, include: { project: { select: { id: true, title: true, status: true } } } }),
    prisma.savedProject.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10, include: { project: { select: { id: true, title: true, budget: true, budgetMin: true, budgetMax: true, status: true } } } }),
  ]);
  const active = orders.filter((o) => ["NEGOTIATION", "IN_PROGRESS", "IN_REVIEW", "REVISION_REQUESTED"].includes(o.status));
  const upcoming = active.flatMap((o) => o.milestones.filter((m) => ["PENDING", "IN_PROGRESS", "REVISION_REQUESTED"].includes(m.status)).map((m) => ({ ...m, orderId: o.id, project: o.project.title }))).sort((a, b) => +a.deadline - +b.deadline).slice(0, 6);
  return (
    <div className="space-y-6 animate-slide-up">
      {header}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat tone={0} icon={Briefcase} label={t.dash.activeJobs} value={active.length} />
        <Stat tone={1} icon={Inbox} label={t.dash.sentProposals} value={proposals.filter((p) => p.status === "SENT").length} />
        <Stat tone={2} icon={MessageCircle} label={t.dash.unread} value={unread} href="/messages" hint={t.common.view} />
        <Stat tone={3} icon={Star} label={fmt(t.dash.completedCount, { n: "" }).replace(/[:\s]+$/, "")} value={orders.filter((o) => o.status === "COMPLETED").length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Section id="dl-h" title={t.dash.upcoming}>
            {upcoming.length ? <ul className="space-y-2">{upcoming.map((m) => (
              <li key={m.id}><Link href={`/orders/${m.orderId}`} className="flex items-center justify-between gap-2 rounded-xl p-2 no-underline hover:bg-slate-50"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-ink">{localizeMilestoneTitle(m.title, lang)}</span><span className="block truncate text-xs text-ink-muted">{m.project}</span></span><span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-700"><CalendarClock className="h-3.5 w-3.5" aria-hidden />{fdate(m.deadline, lang)}</span></Link></li>))}</ul> : <Empty text={t.dash.noDeadlines} />}
          </Section>
          {reviewList}
          {orderList}
        </div>
        <div className="space-y-6">
          <Section id="prop-h" title={t.dash.sentProposals}>
            {proposals.length ? <ul className="divide-y divide-line">{proposals.map((p) => (
              <li key={p.id}><Link href={`/projects/${p.project.id}`} className="-mx-2 flex items-center justify-between gap-2 rounded-xl px-2 py-3 no-underline transition hover:bg-slate-50 dark:hover:bg-slate-800/50"><span className="min-w-0"><span className="block truncate font-semibold text-ink">{p.project.title}</span><span className="text-xs text-ink-muted">{money(p.price, t)} · {fmt(t.pd.delivery, { n: p.deliveryDays })}</span></span><StatusBadge status={p.status} /></Link></li>))}</ul> : <Empty text={t.dash.noProposals} />}
          </Section>
          <Section id="saved-h" title={t.dash.saved}>
            {saved.length ? <ul className="space-y-2">{saved.map((s) => <li key={s.projectId}><Link href={`/projects/${s.project.id}`} className="flex items-center justify-between gap-2 text-sm no-underline"><span className="flex min-w-0 items-center gap-2"><Bookmark className="h-4 w-4 shrink-0 text-brand-600" aria-hidden /><span className="truncate">{s.project.title}</span></span><span className="shrink-0 text-xs text-ink-muted">{moneyRange(s.project, t)}</span></Link></li>)}</ul> : <Empty text={t.dash.noSaved} />}
          </Section>
        </div>
      </div>
    </div>
  );
}
