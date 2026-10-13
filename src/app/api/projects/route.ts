import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ALLOWED_CHAT, MAX_FILE_SIZE, saveUpload } from "@/lib/uploads";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") {
    return NextResponse.json({ error: "Танҳо мизоҷон" }, { status: 403 });
  }
  try {
    const contentType = req.headers.get("content-type") || "";
    let title = "";
    let description = "";
    let category = "";
    let skills = "";
    let budget = 0;
    let deadlineStr = "";
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      title = String(form.get("title") || "").trim();
      description = String(form.get("description") || "").trim();
      category = String(form.get("category") || "").trim();
      skills = String(form.get("skills") || "").trim();
      budget = Number(form.get("budget"));
      deadlineStr = String(form.get("deadline") || "");
      const f = form.get("file");
      if (f instanceof File && f.size > 0) file = f;
    } else {
      const body = await req.json();
      title = String(body.title || "").trim();
      description = String(body.description || "").trim();
      category = String(body.category || "").trim();
      skills = String(body.skills || "").trim();
      budget = Number(body.budget);
      deadlineStr = String(body.deadline || "");
    }

    const deadline = new Date(deadlineStr);
    if (!title || !description || !category || !budget || isNaN(deadline.getTime())) {
      return NextResponse.json({ error: "Маълумотро пур кунед" }, { status: 400 });
    }

    let saved = null as Awaited<ReturnType<typeof saveUpload>> | null;
    if (file) {
      saved = await saveUpload(file, "projects", {
        maxSize: MAX_FILE_SIZE,
        allowed: ALLOWED_CHAT,
      });
    }

    const project = await prisma.project.create({
      data: {
        clientId: user.id,
        title,
        description,
        category,
        skills,
        budget,
        deadline,
        status: "OPEN",
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
    });
    return NextResponse.json({ ok: true, id: project.id });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Хатои сервер";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
