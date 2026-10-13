import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitChat } from "@/lib/realtime";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Вуруд лозим" }, { status: 401 });
  const body = await req.json();
  const projectId = String(body.projectId || "");
  if (!projectId) {
    return NextResponse.json({ error: "projectId лозим" }, { status: 400 });
  }

  const updated = await prisma.message.updateMany({
    where: {
      projectId,
      senderId: { not: user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  const unread = await prisma.message.findMany({
    where: {
      projectId,
      senderId: { not: user.id },
      readAt: { not: null },
    },
    select: { id: true },
    take: 100,
    orderBy: { createdAt: "desc" },
  });

  emitChat({
    type: "read",
    projectId,
    userId: user.id,
    messageIds: unread.map((m) => m.id),
  });

  return NextResponse.json({ ok: true, marked: updated.count });
}
