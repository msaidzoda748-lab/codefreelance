"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Paperclip, Send } from "lucide-react";

export default function ProposalForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("projectId", projectId);
    const res = await fetch("/api/proposals", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Хатогӣ");
      return;
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="card mt-4 space-y-3 border-brand-100 shadow-soft dark:border-brand-900"
    >
      <h3 className="font-bold">Пешниҳоди шумо</h3>
      <div>
        <label className="label">Номаи муқаддимавӣ</label>
        <textarea name="coverLetter" required rows={4} className="input" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Нарх (сом)</label>
          <input name="price" type="number" min={1} required className="input" />
        </div>
        <div>
          <label className="label">Рӯзҳои расонидан</label>
          <input
            name="deliveryDays"
            type="number"
            min={1}
            required
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label inline-flex items-center gap-1">
          <Paperclip className="h-3.5 w-3.5" />
          Замима (ихтиёрӣ, то 5 МБ)
        </label>
        <input
          name="file"
          type="file"
          className="input"
          accept="image/*,.pdf,.txt,.doc,.docx,.zip"
        />
      </div>
      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className="btn-primary">
        <Send className="h-4 w-4" />
        {loading ? "Интизор..." : "Фиристодани пешниҳод"}
      </button>
    </form>
  );
}
