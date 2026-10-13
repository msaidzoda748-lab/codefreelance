"use client";
import Link from "next/link";
import { BadgeCheck, Briefcase, MapPin, Star } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import Avatar from "./Avatar";

export type FreelancerCardData = { userId: string; name: string; avatarUrl: string | null; title: string; city: string; skills: string; rating: number | null; reviews: number; experienceYears: number };

export default function FreelancerCard({ f }: { f: FreelancerCardData }) {
  const { t } = useI18n();
  const skills = f.skills.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <article className="rounded-[20px] border border-line bg-white p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="flex gap-3">
        <div className="relative h-14 w-14 shrink-0 self-start [&_img]:h-14 [&_img]:w-14 [&>div]:h-14 [&>div]:w-14">
          <Avatar name={f.name} src={f.avatarUrl} size="lg" />
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-brand-500 ring-2 ring-white" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold text-ink dark:text-white">{f.name}</h3>
          <p className="truncate text-sm text-ink-muted">{f.title}</p>
          <div className="mt-1 flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
            {f.rating ? <><span className="font-semibold text-ink">{f.rating.toFixed(1)}</span><span className="text-ink-muted">({f.reviews} {t.card.reviews})</span></> : <span className="text-ink-muted">{t.card.noReviews}</span>}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{f.city}</span>
        <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{f.experienceYears} {t.card.years}</span>
        <span className="inline-flex items-center gap-1 text-brand-700"><BadgeCheck className="h-3.5 w-3.5" />{t.card.verified}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {skills.slice(0, 3).map((s) => <span key={s} className="rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800">{s}</span>)}
        {skills.length > 3 && <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-500">+{skills.length - 3}</span>}
      </div>
      <Link href={`/freelancers/${f.userId}`} className="btn-secondary mt-4 w-full no-underline">{t.card.profile}</Link>
    </article>
  );
}
