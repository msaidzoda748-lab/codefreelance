import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Вуруд лозим" }, { status: 401 });
  try {
    const body = await req.json();
    const projectId = String(body.projectId || "");
    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim();

    if (!projectId || rating < 1 || rating > 5 || !comment) {
      return NextResponse.json({ error: "Маълумотро пур кунед" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { proposals: { where: { status: "ACCEPTED" } } },
    });
    if (!project || project.status !== "COMPLETED") {
      return NextResponse.json({ error: "Танҳо пас аз анҷом" }, { status: 400 });
    }
    const accepted = project.proposals[0];
    if (!accepted) {
      return NextResponse.json({ error: "Пешниҳод нест" }, { status: 400 });
    }

    let toUserId: string | null = null;
    if (user.id === project.clientId) {
      toUserId = accepted.freelancerId;
    } else if (user.id === accepted.freelancerId) {
      toUserId = project.clientId;
    } else {
      return NextResponse.json({ error: "Дастрасӣ нест" }, { status: 403 });
    }

    const existing = await prisma.review.findUnique({
      where: { projectId_fromUserId: { projectId, fromUserId: user.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Шумо аллакай баҳо додаед" },
        { status: 400 }
      );
    }

    await prisma.review.create({
      data: {
        projectId,
        fromUserId: user.id,
        toUserId,
        rating,
        comment,
      },
    });

    await notifyUser({
      userId: toUserId,
      type: "NEW_REVIEW",
      title: "Баҳои нав",
      body: `${user.name} ба шумо ${rating} ситора дод`,
      link: `/projects/${projectId}`,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Хатои сервер" }, { status: 500 });
  }
}
