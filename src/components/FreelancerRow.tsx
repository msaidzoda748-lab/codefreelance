import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { avgRating } from "@/lib/auth";
import { parseSkills } from "@/lib/utils";
import Avatar from "./Avatar";
import Stars from "./Stars";

type F = { userId: string; title: string; skills: string; user: { name: string; avatarUrl: string | null; reviewsRecv: { rating: number }[] } };

export default function FreelancerRow({ f, online = true }: { f: F; online?: boolean }) {
  return (
    <Link href={`/freelancers/${f.userId}`} className="card-hover flex gap-4 !p-4 no-underline text-inherit">
      <div className="relative h-16 w-16 shrink-0 self-start">
        <Avatar name={f.user.name} src={f.user.avatarUrl} size="lg" />
        {online && <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-brand-500 ring-2 ring-white" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="font-bold text-navy-900 dark:text-white">{f.user.name}</span>
          <span className="verified"><BadgeCheck className="h-3 w-3" />Мутахассиси санҷидашуда</span>
        </div>
        <div className="text-xs text-slate-500">{f.title}</div>
        <div className="mt-1"><Stars value={avgRating(f.user.reviewsRecv)} count={f.user.reviewsRecv.length} /></div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {parseSkills(f.skills).slice(0, 3).map((s) => <span key={s} className="chip">{s}</span>)}
        </div>
      </div>
    </Link>
  );
}
