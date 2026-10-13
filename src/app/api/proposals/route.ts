import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";
import { ALLOWED_CHAT, MAX_FILE_SIZE, saveUpload } from "@/lib/uploads";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Танҳо фрилансерҳо" }, { status: 403 });
  }
  try {
    const contentType = req.headers.get("content-type") || "";
    let projectId = "";
    let coverLetter = "";
    let price = 0;
    let deliveryDays = 0;
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      projectId = String(form.get("projectId") || "");
      coverLetter = String(form.get("coverLetter") || "").trim();
      price = Number(form.get("price"));
      deliveryDays = Number(form.get("deliveryDays"));
      const f = form.get("file");
      if (f instanceof File && f.size > 0) file = f;
    } else {
      const body = await req.json();
      projectId = String(body.projectId || "");
      coverLetter = String(body.coverLetter || "").trim();
      price = Number(body.price);
      deliveryDays = Number(body.deliveryDays);
    }

    if (!projectId || !coverLetter || !price || !deliveryDays) {
      return NextResponse.json({ error: "Маълумотро пур кунед" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.status !== "OPEN") {
      return NextResponse.json(
        { error: "Лоиҳа барои пешниҳод кушода нест" },
        { status: 400 }
      );
    }

    const existing = await prisma.proposal.findUnique({
      where: {
        projectId_freelancerId: { projectId, freelancerId: user.id },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Шумо аллакай пешниҳод додаед" },
        { status: 400 }
      );
    }

    let saved = null as Awaited<ReturnType<typeof saveUpload>> | null;
    if (file) {
      saved = await saveUpload(file, "proposals", {
        maxSize: MAX_FILE_SIZE,
        allowed: ALLOWED_CHAT,
      });
    }

    const proposal = await prisma.proposal.create({
      data: {
        projectId,
        freelancerId: user.id,
        coverLetter,
        price,
        deliveryDays,
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

    await notifyUser({
      userId: project.clientId,
      type: "NEW_PROPOSAL",
      title: "Пешниҳоди нав",
      body: `${user.name} ба лоиҳаи «${project.title}» пешниҳод дод`,
      link: `/projects/${projectId}`,
    });

    return NextResponse.json({ ok: true, id: proposal.id });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Хатои сервер";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
