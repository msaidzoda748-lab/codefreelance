import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitChat } from "@/lib/realtime";

async function canAccess(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { proposals: { where: { status: "ACCEPTED" } } },
  });
  if (!project || project.status === "OPEN") return null;
  const accepted = project.proposals[0];
  const ok =
    project.clientId === userId ||
    (accepted && accepted.freelancerId === userId);
  return ok ? project : null;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Вуруд лозим" }, { status: 401 });
  const body = await req.json();
  const projectId = String(body.projectId || "");
  const typing = Boolean(body.typing);
  if (!projectId) {
    return NextResponse.json({ error: "projectId лозим" }, { status: 400 });
  }
  if (!(await canAccess(user.id, projectId))) {
    return NextResponse.json({ error: "Дастрасӣ нест" }, { status: 403 });
  }
  emitChat({
    type: "typing",
    projectId,
    userId: user.id,
    name: user.name,
    typing,
  });
  return NextResponse.json({ ok: true });
}
