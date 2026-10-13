import Link from "next/link";
import Avatar from "./Avatar";
import Stars from "./Stars";
import type { Dict } from "@/i18n";
import { fmt } from "@/i18n/format";

export default function FreelancerCard({ f, t }: { f: { id: string; name: string; avatarUrl: string | null; city: string; title: string; skills: string[]; rating: number | null; reviews: number; rateMin: number | null; rateMax: number | null; hourlyRate: number; available: boolean }; t: Dict }) {
  return (
    <Link href={`/freelancers/${f.id}`} className="card card-hover block no-underline" data-testid="freelancer-card">
      <div className="flex items-start gap-3">
        <Avatar name={f.name} src={f.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><h2 className="truncate font-bold text-ink">{f.name}</h2>{f.available && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label={t.prof.available} />}</div>
          <p className="truncate text-sm text-ink-muted">{f.title} · {f.city}</p>
          <Stars value={f.rating} count={f.reviews} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">{f.skills.slice(0, 5).map((s) => <span key={s} className="chip">{s}</span>)}</div>
      <p className="mt-3 text-sm font-semibold text-brand-700">{fmt(t.prof.rate, { a: f.rateMin ?? f.hourlyRate, b: f.rateMax ?? f.hourlyRate })}</p>
    </Link>
  );
}
