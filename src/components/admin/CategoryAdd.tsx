"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { errorText } from "@/i18n/format";
import { api } from "@/lib/client";
import { TextField, FormMessage } from "../ui/Field";

export default function CategoryAdd() {
  const { t } = useI18n();
  const router = useRouter();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const r = await api("/api/admin/categories", { method: "POST", json: Object.fromEntries(new FormData(form).entries()) });
    if (!r.ok) { setFields(r.fields || {}); return setError(errorText(t, r.error)); }
    form.reset(); setFields({}); setError(""); router.refresh();
  }
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-5 sm:items-end" noValidate>
      <TextField label={t.adm.slug} name="slug" error={fields.slug} placeholder="ai-ml" />
      <TextField label={t.adm.nameTj} name="nameTj" error={fields.nameTj} />
      <TextField label={t.adm.nameRu} name="nameRu" />
      <TextField label={t.adm.nameEn} name="nameEn" />
      <button className="btn-primary">{t.adm.add}</button>
      {error && <div className="sm:col-span-5"><FormMessage>{error}</FormMessage></div>}
    </form>
  );
}
