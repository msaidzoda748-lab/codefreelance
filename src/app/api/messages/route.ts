import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emitChat } from "@/lib/realtime";
import { notifyUser } from "@/lib/notifications";
import { ALLOWED_CHAT, MAX_FILE_SIZE, saveUpload } from "@/lib/uploads";

async function canAccess(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { proposals: { where: { status: "ACCEPTED" } } },
  });
  if (!project) return null;
  const accepted = project.proposals[0];
  const ok =
    project.clientId === userId ||
    (accepted && accepted.freelancerId === userId);
  return ok ? { project, accepted } : null;
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Вуруд лозим" }, { status: 401 });
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId лозим" }, { status: 400 });
  }
  const access = await canAccess(user.id, projectId);
  if (!access) {
    return NextResponse.json({ error: "Дастрасӣ нест" }, { status: 403 });
  }
  const messages = await prisma.message.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      attachments: true,
    },
  });
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Вуруд лозим" }, { status: 401 });

  const contentType = req.headers.get("content-type") || "";
  let projectId = "";
  let text = "";
  let file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    projectId = String(form.get("projectId") || "");
    text = String(form.get("body") || "").trim();
    const f = form.get("file");
    if (f instanceof File && f.size > 0) file = f;
  } else {
    const body = await req.json();
    projectId = String(body.projectId || "");
    text = String(body.body || "").trim();
  }

  if (!projectId || (!text && !file)) {
    return NextResponse.json(
      { error: "Паём ё файл лозим аст" },
      { status: 400 }
    );
  }

  const access = await canAccess(user.id, projectId);
  if (!access) {
    return NextResponse.json({ error: "Дастрасӣ нест" }, { status: 403 });
  }
  if (access.project.status === "OPEN") {
    return NextResponse.json(
      { error: "Чат пас аз қабули пешниҳод" },
      { status: 400 }
    );
  }

  let saved = null as Awaited<ReturnType<typeof saveUpload>> | null;
  if (file) {
    try {
      saved = await saveUpload(file, "chat", {
        maxSize: MAX_FILE_SIZE,
        allowed: ALLOWED_CHAT,
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Хатои файл" },
        { status: 400 }
      );
    }
  }

  const msg = await prisma.message.create({
    data: {
      projectId,
      senderId: user.id,
      body: text || (saved ? `📎 ${saved.name}` : ""),
      ...(saved
        ? {
            attachments: {
              create: {
                uploaderId: user.id,
                url: saved.url,
                name: saved.name,
                mimeType: saved.mimeType,
                size: saved.size,
              },
            },
          }
        : {}),
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      attachments: true,
    },
  });

  emitChat({ type: "message", projectId, message: msg });

  const recipientId =
    access.project.clientId === user.id
      ? access.accepted?.freelancerId
      : access.project.clientId;
  if (recipientId) {
    await notifyUser({
      userId: recipientId,
      type: "CHAT_MESSAGE",
      title: "Паёми нав",
      body: `${user.name}: ${text || saved?.name || "файл"}`,
      link: `/projects/${projectId}/chat`,
    });
  }

  return NextResponse.json({ message: msg });
}
