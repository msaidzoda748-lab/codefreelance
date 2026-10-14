import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDict, getLang } from "@/i18n/server";
import ConvList, { loadConversations } from "./ConvList";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: getDict().chat.title }; }
export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/messages");
  const t = getDict(); const lang = getLang();
  const items = await loadConversations(user.id);
  return (
    <div className="animate-slide-up">
      <h1 className="mb-4 page-title">{t.chat.title}</h1>
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="card overflow-hidden !p-0"><ConvList items={items} t={t} lang={lang} /></div>
        <div className="card hidden items-center justify-center text-sm text-ink-muted lg:flex">{t.chat.select}</div>
      </div>
    </div>
  );
}
