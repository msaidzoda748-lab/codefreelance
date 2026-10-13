"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Paperclip, Rocket } from "lucide-react";
import { CATEGORIES } from "@/lib/utils";

export default function NewProjectPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/projects", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Хатогӣ");
      return;
    }
    router.push(`/projects/${data.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl animate-slide-up">
      <h1 className="section-title mb-6">Эълони лоиҳаи нав</h1>
      <form onSubmit={onSubmit} className="card space-y-4 shadow-soft">
        <div>
          <label className="label">Унвон</label>
          <input name="title" required className="input" />
        </div>
        <div>
          <label className="label">Тавсиф</label>
          <textarea name="description" required rows={5} className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Категория</label>
            <select name="category" required className="input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Буҷет (сом)</label>
            <input name="budget" type="number" min={1} required className="input" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Маҳоратҳо (бо вергул)</label>
            <input name="skills" className="input" placeholder="React, Design, ..." />
          </div>
          <div>
            <label className="label">Мӯҳлат</label>
            <input name="deadline" type="date" required className="input" />
          </div>
        </div>
        <div>
          <label className="label inline-flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5" />
            Замима (ихтиёрӣ)
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
          <Rocket className="h-4 w-4" />
          {loading ? "Интизор..." : "Нашр кардан"}
        </button>
      </form>
    </div>
  );
}
