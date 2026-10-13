import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ChatBox from "@/components/ChatBox";

export const dynamic = "force-dynamic";
export const metadata = { title: "Чат" };

export default async function ChatPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { proposals: { where: { status: "ACCEPTED" } } },
  });
  if (!project) notFound();

  const accepted = project.proposals[0];
  const allowed =
    project.clientId === user.id ||
    (accepted && accepted.freelancerId === user.id);
  if (!allowed || project.status === "OPEN") {
    redirect(`/projects/${project.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-slide-up">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Бозгашт ба лоиҳа
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
          Чат: {project.title}
        </h1>
      </div>
      <ChatBox projectId={project.id} currentUserId={user.id} />
    </div>
  );
}
