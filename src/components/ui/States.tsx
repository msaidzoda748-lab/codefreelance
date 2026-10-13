import { Inbox, Loader2 } from "lucide-react";
export function EmptyState({ title, hint, icon: Icon = Inbox, children }: { title: string; hint?: string; icon?: React.ComponentType<{ className?: string }>; children?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <Icon className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
      <p className="mt-3 font-bold text-ink dark:text-white">{title}</p>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
export function Spinner({ label }: { label: string }) {
  return <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-ink-muted"><Loader2 className="h-5 w-5 animate-spin" aria-hidden />{label}</div>;
}
