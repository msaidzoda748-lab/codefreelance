import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "");

    if (!name || !email || password.length < 6) {
      return NextResponse.json(
        { error: "Маълумотро дуруст пур кунед" },
        { status: 400 }
      );
    }
    if (role !== "CLIENT" && role !== "FREELANCER") {
      return NextResponse.json({ error: "Нақши нодуруст" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "Ин почта аллакай сабт шудааст" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        ...(role === "FREELANCER"
          ? {
              profile: {
                create: {
                  title: "Фрилансер",
                  bio: "",
                  skills: "",
                  hourlyRate: 10,
                  portfolio: "",
                },
              },
            }
          : {}),
      },
    });

    await createSession(user.id);
    return NextResponse.json({ ok: true, role: user.role });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Хатои сервер" }, { status: 500 });
  }
}
