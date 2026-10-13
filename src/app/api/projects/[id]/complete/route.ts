import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") {
    return NextResponse.json({ error: "Танҳо мизоҷ" }, { status: 403 });
  }
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { proposals: { where: { status: "ACCEPTED" } } },
  });
  if (!project || project.clientId !== user.id) {
    return NextResponse.json({ error: "Лоиҳа ёфт нашуд" }, { status: 404 });
  }
  if (project.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Лоиҳа дар ҷараён нест" },
      { status: 400 }
    );
  }
  await prisma.project.update({
    where: { id: project.id },
    data: { status: "COMPLETED" },
  });

  const freelancerId = project.proposals[0]?.freelancerId;
  if (freelancerId) {
    await notifyUser({
      userId: freelancerId,
      type: "PROJECT_COMPLETED",
      title: "Лоиҳа анҷом ёфт",
      body: `Лоиҳаи «${project.title}» анҷомёфта қайд шуд`,
      link: `/projects/${project.id}`,
    });
  }

  return NextResponse.json({ ok: true });
}
