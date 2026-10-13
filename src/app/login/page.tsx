"use client";

import { SITE } from "@/config/site";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Briefcase, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Хатогӣ");
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next") || "/";
    router.push(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  }

  return (
    <div className="mx-auto grid max-w-md animate-slide-up gap-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-soft">
          <Briefcase className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Вуруд ба {SITE.name}
        </h1>
        <p className="mt-1 text-sm muted">
          Ҳисоб надоред?{" "}
          <Link href="/register" className="font-semibold text-brand-600">
            Сабти ном
          </Link>
        </p>
      </div>
      <form onSubmit={onSubmit} className="card space-y-4 shadow-soft">
        <div>
          <label className="label">Почтаи электронӣ</label>
          <input
            name="email"
            type="email"
            required
            className="input"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="label">Рамз</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="input"
          />
        </div>
        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          <LogIn className="h-4 w-4" />
          {loading ? "Интизор шавед..." : "Вуруд"}
        </button>
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs muted dark:bg-slate-800/50">
          Демо: client@demo.tj / password123 ё freelancer@demo.tj / password123
        </p>
      </form>
    </div>
  );
}
