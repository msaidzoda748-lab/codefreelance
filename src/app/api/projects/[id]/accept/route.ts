import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") {
    return NextResponse.json({ error: "Танҳо мизоҷ" }, { status: 403 });
  }
  const body = await req.json();
  const proposalId = String(body.proposalId || "");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { proposals: true },
  });
  if (!project || project.clientId !== user.id) {
    return NextResponse.json({ error: "Лоиҳа ёфт нашуд" }, { status: 404 });
  }
  if (project.status !== "OPEN") {
    return NextResponse.json({ error: "Лоиҳа кушода нест" }, { status: 400 });
  }
  const proposal = project.proposals.find((p) => p.id === proposalId);
  if (!proposal) {
    return NextResponse.json({ error: "Пешниҳод ёфт нашуд" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.proposal.update({
      where: { id: proposalId },
      data: { status: "ACCEPTED" },
    }),
    prisma.proposal.updateMany({
      where: { projectId: project.id, id: { not: proposalId } },
      data: { status: "REJECTED" },
    }),
    prisma.project.update({
      where: { id: project.id },
      data: { status: "IN_PROGRESS", acceptedProposalId: proposalId },
    }),
  ]);

  await notifyUser({
    userId: proposal.freelancerId,
    type: "PROPOSAL_ACCEPTED",
    title: "Пешниҳод қабул шуд",
    body: `Пешниҳоди шумо барои «${project.title}» қабул шуд`,
    link: `/projects/${project.id}/chat`,
  });

  return NextResponse.json({ ok: true });
}
