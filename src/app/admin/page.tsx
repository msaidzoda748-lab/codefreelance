import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDict, getLang } from "@/i18n/server";
import { fdate, fdatetime } from "@/i18n/format";
import StatusBadge from "@/components/StatusBadge";
import ActionButton from "@/components/ui/ActionButton";
import Pagination from "@/components/ui/Pagination";
import CategoryAdd from "@/components/admin/CategoryAdd";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().adm.title }; }
const TABS = ["stats", "users", "projects", "reviews", "works", "reports", "categories", "audit"] as const;
type Tab = (typeof TABS)[number];
const SIZE = 20;
const ci = "insensitive" as const;

export default async function AdminPage({ searchParams }: { searchParams: { tab?: string; q?: string; page?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!user.isAdmin) notFound();
  const t = getDict(); const lang = getLang();
  const tab: Tab = (TABS as readonly string[]).includes(searchParams.tab || "") ? (searchParams.tab as Tab) : "stats";
  const q = (searchParams.q || "").trim().slice(0, 100);
  const page = Math.max(1, Number(searchParams.page) || 1);
  const skip = (page - 1) * SIZE;
  const mod = (targetType: string, targetId: string, action: string, label: string, danger = false, extra?: boolean) => (
    <ActionButton url="/api/admin/moderate" body={{ targetType, targetId, action }} label={label} className={`btn-secondary !min-h-[36px] !px-3 text-xs ${danger ? "!text-rose-600" : ""}`}
      prompt={{ label: t.adm.reasonPrompt, field: "reason" }} extraCheckbox={extra ? { label: t.adm.hideTarget, field: "hideTarget" } : undefined} testId={`mod-${action}-${targetId}`} />
  );
  let body: React.ReactNode = null; let pages = 1;
  const th = "";
  const td = "p-3 align-top";

  if (tab === "stats") {
    const [users, restricted, projects, open, orders, done, reports, reviews] = await Promise.all([
      prisma.user.count(), prisma.user.count({ where: { status: "RESTRICTED" } }), prisma.project.count(), prisma.project.count({ where: { status: "OPEN" } }),
      prisma.order.count(), prisma.order.count({ where: { status: "COMPLETED" } }), prisma.report.count({ where: { status: "OPEN" } }), prisma.review.count(),
    ]);
    const cards: [string, number][] = [[t.adm.users, users], [t.status.RESTRICTED, restricted], [t.adm.projects, projects], [t.status.OPEN, open], [t.adm.orders, orders], [t.status.COMPLETED, done], [t.adm.openReports, reports], [t.adm.reviews, reviews]];
    body = <div className="grid grid-cols-2 gap-3 md:grid-cols-4" data-testid="admin-stats">{cards.map(([l, v]) => <div key={l} className="card !p-4"><div className="text-2xl font-extrabold text-ink">{v}</div><div className="text-xs text-ink-muted">{l}</div></div>)}</div>;
  } else if (tab === "users") {
    const where = q ? { OR: [{ name: { contains: q, mode: ci } }, { email: { contains: q, mode: ci } }] } : {};
    const [rows, total] = await Promise.all([prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: SIZE }), prisma.user.count({ where })]);
    pages = Math.ceil(total / SIZE);
    body = <table className="table-clean w-full min-w-[720px] text-sm"><thead><tr><th className={th}>{t.auth.fullName}</th><th className={th}>{t.auth.email}</th><th className={th}>{t.common.status}</th><th className={th}>{t.common.date}</th><th className={th}>{t.common.actions}</th></tr></thead>
      <tbody className="divide-y divide-line">{rows.map((u) => <tr key={u.id}><td className={td}><Link href={`/freelancers/${u.id}`}>{u.name}</Link>{u.isAdmin && " ★"}{u.isDemo && <span className="ml-1 text-[10px] text-ink-muted">demo</span>}<div className="text-xs text-ink-muted">{u.role === "CLIENT" ? t.auth.client : t.auth.freelancer}</div></td><td className={td}>{u.email}</td><td className={td}><StatusBadge status={u.status} />{u.restrictedReason && <div className="text-xs text-ink-muted">{u.restrictedReason}</div>}</td><td className={td}>{fdatetime(u.createdAt, lang)}</td>
        <td className={td}>{u.id !== user.id && <div className="flex flex-wrap gap-1">{u.status === "ACTIVE" ? mod("USER", u.id, "restrict", t.adm.restrict, true) : mod("USER", u.id, "reactivate", t.adm.reactivate)}{u.isAdmin ? mod("USER", u.id, "removeAdmin", t.adm.removeAdmin, true) : mod("USER", u.id, "makeAdmin", t.adm.makeAdmin)}</div>}</td></tr>)}</tbody></table>;
  } else if (tab === "projects") {
    const where = q ? { title: { contains: q, mode: ci } } : {};
    const [rows, total] = await Promise.all([prisma.project.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: SIZE, include: { client: { select: { name: true } } } }), prisma.project.count({ where })]);
    pages = Math.ceil(total / SIZE);
    body = <table className="table-clean w-full min-w-[720px] text-sm"><thead><tr><th className={th}>{t.pf.title}</th><th className={th}>{t.pd.client}</th><th className={th}>{t.common.status}</th><th className={th}>{t.common.actions}</th></tr></thead>
      <tbody className="divide-y divide-line">{rows.map((p) => <tr key={p.id}><td className={td}><Link href={`/projects/${p.id}`}>{p.title}</Link>{p.hidden && <span className="ml-2 rounded bg-rose-50 px-1.5 text-[10px] font-bold text-rose-700">{t.adm.hidden}</span>}</td><td className={td}>{p.client.name}</td><td className={td}><StatusBadge status={p.status} /></td>
        <td className={td}>{p.hidden ? mod("PROJECT", p.id, "unhide", t.adm.unhide) : mod("PROJECT", p.id, "hide", t.adm.hide, true)}</td></tr>)}</tbody></table>;
  } else if (tab === "reviews") {
    const where = q ? { comment: { contains: q, mode: ci } } : {};
    const [rows, total] = await Promise.all([prisma.review.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: SIZE, include: { fromUser: { select: { name: true } }, toUser: { select: { name: true } } } }), prisma.review.count({ where })]);
    pages = Math.ceil(total / SIZE);
    body = <table className="table-clean w-full min-w-[720px] text-sm"><thead><tr><th className={th}>{t.rev.comment}</th><th className={th}>{t.rev.rating}</th><th className={th}>{t.common.actions}</th></tr></thead>
      <tbody className="divide-y divide-line">{rows.map((r) => <tr key={r.id}><td className={td}><div className="text-xs text-ink-muted">{r.fromUser.name} → {r.toUser.name}</div>{r.comment}{r.hidden && <span className="ml-2 rounded bg-rose-50 px-1.5 text-[10px] font-bold text-rose-700">{t.adm.hidden}</span>}</td><td className={td}>{r.rating}★</td>
        <td className={td}>{r.hidden ? mod("REVIEW", r.id, "unhide", t.adm.unhide) : mod("REVIEW", r.id, "hide", t.adm.hide, true)}</td></tr>)}</tbody></table>;
  } else if (tab === "works") {
    const where = q ? { OR: [{ title: { contains: q, mode: ci } }, { tech: { contains: q, mode: ci } }] } : {};
    const [rows, total] = await Promise.all([prisma.portfolioItem.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: SIZE, include: { profile: { select: { user: { select: { id: true, name: true } } } } } }), prisma.portfolioItem.count({ where })]);
    pages = Math.ceil(total / SIZE);
    body = <table className="table-clean w-full min-w-[720px] text-sm" data-testid="admin-works"><thead><tr><th>{t.works.name}</th><th>{t.works.author}</th><th>{t.common.date}</th><th>{t.common.actions}</th></tr></thead>
      <tbody className="divide-y divide-line">{rows.map((w) => <tr key={w.id}><td className={td}><Link href={`/works/${w.id}`}>{w.title}</Link>{w.hidden && <span className="ml-2 rounded bg-rose-50 px-1.5 text-[10px] font-bold text-rose-700">{t.adm.hidden}</span>}<div className="text-xs text-ink-muted">{w.tech}</div></td><td className={td}><Link href={`/freelancers/${w.profile.user.id}`}>{w.profile.user.name}</Link></td><td className={td}>{fdate(w.createdAt, lang)}</td>
        <td className={td}>{w.hidden ? mod("WORK", w.id, "unhide", t.adm.unhide) : mod("WORK", w.id, "hide", t.adm.hide, true)}</td></tr>)}</tbody></table>;
  } else if (tab === "reports") {
    const where = { ...(q ? { OR: [{ reason: { contains: q, mode: ci } }, { details: { contains: q, mode: ci } }] } : {}) };
    const [rows, total] = await Promise.all([prisma.report.findMany({ where, orderBy: [{ status: "desc" }, { createdAt: "desc" }], skip, take: SIZE, include: { reporter: { select: { name: true } } } }), prisma.report.count({ where })]);
    pages = Math.ceil(total / SIZE);
    const link = (r: { targetType: string; targetId: string }) => r.targetType === "PROJECT" ? `/projects/${r.targetId}` : r.targetType === "USER" ? `/freelancers/${r.targetId}` : r.targetType === "WORK" ? `/works/${r.targetId}` : null;
    body = <table className="table-clean w-full min-w-[760px] text-sm"><thead><tr><th className={th}>{t.adm.target}</th><th className={th}>{t.common.reason}</th><th className={th}>{t.common.status}</th><th className={th}>{t.common.actions}</th></tr></thead>
      <tbody className="divide-y divide-line">{rows.map((r) => { const l = link(r); return <tr key={r.id}><td className={td}>{r.targetType} {l ? <Link href={l}>{r.targetId.slice(-6)}</Link> : <code className="text-xs">{r.targetId.slice(-6)}</code>}<div className="text-xs text-ink-muted">{r.reporter.name} · {fdatetime(r.createdAt, lang)}</div></td><td className={td}>{(t.rev as Record<string, string>)[`r_${r.reason}`] ?? r.reason}{r.details && <div className="text-xs text-ink-muted">{r.details}</div>}{r.resolution && <div className="text-xs text-brand-700">→ {r.resolution}</div>}</td><td className={td}><StatusBadge status={r.status} /></td>
        <td className={td}>{r.status === "OPEN" && <div className="flex flex-wrap gap-1">{mod("REPORT", r.id, "resolve", t.adm.resolve, false, r.targetType !== "USER")}{mod("REPORT", r.id, "dismiss", t.adm.dismiss)}</div>}</td></tr>; })}</tbody></table>;
  } else if (tab === "categories") {
    const rows = await prisma.category.findMany({ orderBy: [{ sort: "asc" }, { slug: "asc" }], include: { _count: { select: { projects: true } } } });
    body = <div className="space-y-4"><div className="card"><CategoryAdd /></div><table className="table-clean w-full min-w-[640px] text-sm"><thead><tr><th className={th}>{t.adm.slug}</th><th className={th}>TJ / RU / EN</th><th className={th}>{t.adm.projects}</th><th className={th}>{t.common.actions}</th></tr></thead>
      <tbody className="divide-y divide-line">{rows.map((c) => <tr key={c.id} className={c.active ? "" : "opacity-60"}><td className={td}><code>{c.slug}</code></td><td className={td}>{c.nameTj} / {c.nameRu} / {c.nameEn}</td><td className={td}>{c._count.projects}</td>
        <td className={td}><ActionButton url={`/api/admin/categories/${c.id}`} method="PATCH" body={{ active: !c.active }} label={c.active ? t.adm.disable : t.adm.enable} className="btn-secondary !min-h-[36px] !px-3 text-xs" /></td></tr>)}</tbody></table></div>;
  } else {
    const where = q ? { OR: [{ action: { contains: q, mode: ci } }, { reason: { contains: q, mode: ci } }, { targetId: q }] } : {};
    const [rows, total] = await Promise.all([prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: SIZE, include: { actor: { select: { name: true } } } }), prisma.auditLog.count({ where })]);
    pages = Math.ceil(total / SIZE);
    body = <table className="table-clean w-full min-w-[720px] text-sm" data-testid="audit"><thead><tr><th className={th}>{t.common.date}</th><th className={th}>{t.adm.actor}</th><th className={th}>{t.adm.action}</th><th className={th}>{t.adm.target}</th><th className={th}>{t.common.reason}</th></tr></thead>
      <tbody className="divide-y divide-line">{rows.map((a) => <tr key={a.id}><td className={td}>{fdatetime(a.createdAt, lang)}</td><td className={td}>{a.actor.name}</td><td className={td}><code className="text-xs">{a.action}</code></td><td className={td}>{a.targetType} <code className="text-xs">{a.targetId.slice(-6)}</code></td><td className={td}>{a.reason}</td></tr>)}</tbody></table>;
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">{t.adm.title}</h1>
        {user.isDemo && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{t.adm.demoAdmin}</span>}
      </div>
      <nav aria-label={t.adm.title} className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {TABS.map((k) => <Link key={k} href={`/admin?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={`inline-flex min-h-[44px] shrink-0 items-center rounded-xl px-4 text-sm font-semibold no-underline ${tab === k ? "bg-brand-600 text-white" : "bg-white text-navy-800 ring-1 ring-line hover:ring-brand-300"}`}>{t.adm[k]}</Link>)}
      </nav>
      {!["stats", "categories"].includes(tab) && (
        <form role="search" className="flex max-w-xl gap-2"><input type="hidden" name="tab" value={tab} /><label htmlFor="aq" className="sr-only">{t.common.search}</label><input id="aq" name="q" type="search" defaultValue={q} placeholder={t.adm.searchPh} className="input flex-1" /><button className="btn-primary">{t.common.search}</button></form>
      )}
      <div className={tab === "stats" ? "" : "overflow-x-auto rounded-card border border-line bg-white shadow-card dark:border-slate-800 dark:bg-slate-900"}>{body}</div>
      <Pagination page={page} pages={pages} params={{ tab, q }} basePath="/admin" />
    </div>
  );
}
