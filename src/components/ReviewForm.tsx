"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star } from "lucide-react";

export default function ReviewForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        rating: Number(fd.get("rating")),
        comment: fd.get("comment"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Хатогӣ");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card mt-4 space-y-3 shadow-soft">
      <h3 className="flex items-center gap-2 font-bold">
        <Star className="h-4 w-4 text-amber-400" />
        Баҳо додан
      </h3>
      <div>
        <label className="label">Баҳо (1–5)</label>
        <select name="rating" required className="input">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} ситора
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Шарҳ</label>
        <textarea name="comment" required rows={3} className="input" />
      </div>
      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
      <button type="submit" disabled={loading} className="btn-primary">
        Фиристодан
      </button>
    </form>
  );
}
