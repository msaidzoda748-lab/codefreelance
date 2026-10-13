"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText, fmt } from "@/i18n/format";
import { api } from "@/lib/client";
import { TextArea, FormMessage } from "./ui/Field";

export default function ReviewForm({ orderId }: { orderId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const comment = String(new FormData(e.currentTarget).get("comment") || "");
    const fe: Record<string, string> = {};
    if (!rating) fe.rating = "rating";
    if (comment.trim().length < 5) fe.comment = "min5";
    setFields(fe); if (Object.keys(fe).length) return;
    setBusy(true); setError("");
    const r = await api("/api/reviews", { method: "POST", json: { orderId, rating, comment } });
    setBusy(false);
    if (!r.ok) { setFields(r.fields || {}); return setError(errorText(t, r.error)); }
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="card space-y-4" noValidate data-testid="review-form">
      <h3 className="font-bold text-ink">{t.rev.title}</h3>
      <fieldset>
        <legend className="label">{t.rev.rating}</legend>
        <div role="radiogroup" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={fmt(t.rev.stars, { n })} onClick={() => setRating(n)}
              className="flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
              <Star className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden />
            </button>
          ))}
        </div>
        {fields.rating && <p role="alert" className="field-error">{t.v.rating}</p>}
      </fieldset>
      <TextArea label={t.rev.comment} name="comment" rows={3} error={fields.comment} />
      {error && <FormMessage>{error}</FormMessage>}
      <button className="btn-primary" disabled={busy}>{busy ? t.common.sending : t.rev.send}</button>
    </form>
  );
}
