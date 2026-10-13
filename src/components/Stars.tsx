import { Star } from "lucide-react";

export default function Stars({
  value,
  count,
}: {
  value: number | null;
  count?: number;
}) {
  if (value == null) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-slate-400">
        <Star className="h-3.5 w-3.5" />
        Ҳанӯз баҳо нест
      </span>
    );
  }
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5 text-sm">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= full
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
          }`}
        />
      ))}
      <span className="ml-1.5 font-semibold text-slate-700 dark:text-slate-200">
        {value}
      </span>
      {typeof count === "number" && (
        <span className="text-slate-400">({count})</span>
      )}
    </span>
  );
}
