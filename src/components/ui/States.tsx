import { Inbox, Loader2 } from "lucide-react";
/** Empty state with a soft layered illustration (pure CSS, no assets). */
export function EmptyState({ title, hint, icon: Icon = Inbox, children }: { title: string; hint?: string; icon?: React.ComponentType<{ className?: string }>; children?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-card border border-dashed border-line bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-brand-mesh opacity-60" aria-hidden />
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center" aria-hidden>
        <span className="absolute inset-0 rotate-6 rounded-[22px] bg-brand-100/70 dark:bg-brand-900/40" />
        <span className="absolute inset-1 -rotate-6 rounded-[20px] bg-white shadow-card dark:bg-slate-800" />
        <Icon className="relative h-9 w-9 text-brand-500" />
      </div>
      <p className="relative mt-4 font-bold text-ink dark:text-white">{title}</p>
      {hint && <p className="relative mx-auto mt-1 max-w-sm text-sm text-ink-muted">{hint}</p>}
      {children && <div className="relative mt-5">{children}</div>}
    </div>
  );
}
export function Spinner({ label }: { label: string }) {
  return <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-ink-muted"><Loader2 className="h-5 w-5 animate-spin" aria-hidden />{label}</div>;
}
export function Skeleton({ className = "" }: { className?: string }) { return <div className={`skeleton ${className}`} aria-hidden />; }
export function SkeletonList({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3"><Skeleton className="h-10 w-10 !rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-2/3" /></div></div>
      ))}
    </div>
  );
}
