export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-10" aria-busy="true">
      <div className="h-8 w-1/3 rounded-lg bg-slate-200/70" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-48 rounded-2xl bg-slate-200/60" />)}
      </div>
    </div>
  );
}
