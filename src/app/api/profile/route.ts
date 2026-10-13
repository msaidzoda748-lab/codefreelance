import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Танҳо фрилансер" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const bio = String(body.bio || "").trim();
    const skills = String(body.skills || "").trim();
    const hourlyRate = Number(body.hourlyRate);
    const portfolio = String(body.portfolio || "").trim();
    const name = String(body.name || "").trim();

    if (!title || !name || !hourlyRate) {
      return NextResponse.json({ error: "Маълумотро пур кунед" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { name } }),
      prisma.freelancerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          title,
          bio,
          skills,
          hourlyRate,
          portfolio,
        },
        update: { title, bio, skills, hourlyRate, portfolio },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Хатои сервер" }, { status: 500 });
  }
}
