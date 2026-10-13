"use client";

import { SITE } from "@/config/site";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
        role: fd.get("role"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Хатогӣ");
      return;
    }
    router.push(data.role === "FREELANCER" ? "/profile" : "/");
    router.refresh();
  }

  return (
    <div className="mx-auto grid max-w-md animate-slide-up gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Сабти ном дар {SITE.name}
        </h1>
        <p className="mt-1 text-sm muted">
          Аллакай ҳисоб доред?{" "}
          <Link href="/login" className="font-semibold text-brand-600">
            Вуруд
          </Link>
        </p>
      </div>
      <form onSubmit={onSubmit} className="card space-y-4 shadow-soft">
        <div>
          <label className="label">Ном</label>
          <input name="name" required className="input" />
        </div>
        <div>
          <label className="label">Почтаи электронӣ</label>
          <input name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="label">Рамз (ҳадди ақал 6 аломат)</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="input"
          />
        </div>
        <div>
          <label className="label">Нақш</label>
          <select name="role" required className="input">
            <option value="CLIENT">Мизоҷ (лоиҳа эълон мекунам)</option>
            <option value="FREELANCER">Фрилансер (кор меҷӯям)</option>
          </select>
        </div>
        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          <UserPlus className="h-4 w-4" />
          {loading ? "Интизор шавед..." : "Сабти ном"}
        </button>
      </form>
    </div>
  );
}
