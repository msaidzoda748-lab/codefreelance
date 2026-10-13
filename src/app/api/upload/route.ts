import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_CHAT,
  ALLOWED_IMAGE,
  MAX_AVATAR_SIZE,
  MAX_FILE_SIZE,
  saveUpload,
  type UploadKind,
} from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Вуруд лозим" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "") as UploadKind;
    const projectId = form.get("projectId")
      ? String(form.get("projectId"))
      : null;
    const proposalId = form.get("proposalId")
      ? String(form.get("proposalId"))
      : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл лозим аст" }, { status: 400 });
    }
    if (!["avatars", "projects", "proposals", "chat"].includes(kind)) {
      return NextResponse.json({ error: "Намуди нодуруст" }, { status: 400 });
    }

    if (kind === "avatars") {
      const saved = await saveUpload(file, "avatars", {
        imagesOnly: true,
        maxSize: MAX_AVATAR_SIZE,
        allowed: ALLOWED_IMAGE,
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: saved.url },
      });
      return NextResponse.json({ ok: true, ...saved, avatarUrl: saved.url });
    }

    if (kind === "projects") {
      if (!projectId) {
        return NextResponse.json({ error: "projectId лозим" }, { status: 400 });
      }
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project || project.clientId !== user.id) {
        return NextResponse.json({ error: "Дастрасӣ нест" }, { status: 403 });
      }
      const saved = await saveUpload(file, "projects", {
        maxSize: MAX_FILE_SIZE,
        allowed: ALLOWED_CHAT,
      });
      const att = await prisma.attachment.create({
        data: {
          uploaderId: user.id,
          projectId,
          url: saved.url,
          name: saved.name,
          mimeType: saved.mimeType,
          size: saved.size,
        },
      });
      return NextResponse.json({ ok: true, attachment: att });
    }

    if (kind === "proposals") {
      if (!proposalId) {
        return NextResponse.json({ error: "proposalId лозим" }, { status: 400 });
      }
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
      });
      if (!proposal || proposal.freelancerId !== user.id) {
        return NextResponse.json({ error: "Дастрасӣ нест" }, { status: 403 });
      }
      const saved = await saveUpload(file, "proposals", {
        maxSize: MAX_FILE_SIZE,
        allowed: ALLOWED_CHAT,
      });
      const att = await prisma.attachment.create({
        data: {
          uploaderId: user.id,
          proposalId,
          url: saved.url,
          name: saved.name,
          mimeType: saved.mimeType,
          size: saved.size,
        },
      });
      return NextResponse.json({ ok: true, attachment: att });
    }

    // chat uploads are attached when sending message
    const saved = await saveUpload(file, "chat", {
      maxSize: MAX_FILE_SIZE,
      allowed: ALLOWED_CHAT,
    });
    return NextResponse.json({ ok: true, ...saved });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Хатои боргузорӣ";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
