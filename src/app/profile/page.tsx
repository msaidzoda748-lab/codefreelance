"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save } from "lucide-react";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

type Profile = {
  name: string;
  title: string;
  bio: string;
  skills: string;
  hourlyRate: number;
  portfolio: string;
  avatarUrl?: string | null;
};

export default function MyProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, t } = useI18n();

  useEffect(() => {
    fetch("/api/profile/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setProfile(d);
      });
  }, []);

  async function uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "avatars");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Хатои аватар");
      return;
    }
    setProfile((p) => (p ? { ...p, avatarUrl: data.avatarUrl } : p));
    setOk("Аватар навсозӣ шуд");
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError("");
    setOk("");
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Хатогӣ");
      return;
    }
    setOk("Сабт шуд!");
    router.refresh();
  }

  if (!profile && !error) return <p className="muted">Боргирӣ...</p>;
  if (error && !profile) return <p className="text-rose-600">{error}</p>;
  if (user?.role === "CLIENT") {
    return (
      <div className="mx-auto max-w-md animate-slide-up">
        <div className="card text-center">
          <div className="mx-auto w-fit"><Avatar name={user.name} src={user.avatarUrl} size="lg" /></div>
          <h1 className="mt-3 text-xl font-bold text-ink">{user.name}</h1>
          <p className="text-sm text-ink-muted">Мизоҷ</p>
          <div className="mt-5 grid gap-2">
            <Link href="/projects?status=ALL" className="btn-secondary no-underline">{t.nav.projects}</Link>
            <Link href="/messages" className="btn-secondary no-underline">{t.bottom.messages}</Link>
            <Link href="/notifications" className="btn-secondary no-underline">{t.nav.notifications}</Link>
            <form action="/api/auth/logout" method="POST"><button className="btn-ghost w-full">{t.nav.logout}</button></form>
          </div>
        </div>
      </div>
    );
  }
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl animate-slide-up">
      <h1 className="section-title mb-6">Профили ман</h1>
      <div className="card mb-4 flex items-center gap-4 shadow-soft">
        <Avatar name={profile.name} src={profile.avatarUrl} size="lg" />
        <div>
          <p className="text-sm muted">Аватар (JPG/PNG/WebP, то 2 МБ)</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
            }}
          />
          <button
            type="button"
            className="btn-secondary mt-2"
            onClick={() => fileRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
            Боргузории аватар
          </button>
        </div>
      </div>
      <form onSubmit={onSubmit} className="card space-y-4 shadow-soft">
        <div>
          <label className="label">Ном</label>
          <input
            className="input"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Унвон</label>
          <input
            className="input"
            value={profile.title}
            onChange={(e) => setProfile({ ...profile, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Дар бораи ман</label>
          <textarea
            className="input"
            rows={4}
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Маҳоратҳо (бо вергул)</label>
          <input
            className="input"
            value={profile.skills}
            onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Нархи соат (сом)</label>
          <input
            type="number"
            min={1}
            className="input"
            value={profile.hourlyRate}
            onChange={(e) =>
              setProfile({ ...profile, hourlyRate: Number(e.target.value) })
            }
            required
          />
        </div>
        <div>
          <label className="label">Пайвандҳои портфолио</label>
          <textarea
            className="input"
            rows={3}
            value={profile.portfolio}
            onChange={(e) =>
              setProfile({ ...profile, portfolio: e.target.value })
            }
          />
        </div>
        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        {ok && (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {ok}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary">
          <Save className="h-4 w-4" />
          {loading ? "Интизор..." : "Сабт кардан"}
        </button>
      </form>
    </div>
  );
}
