import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storageNote } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      service: "CodeFreelance",
      db: "up",
      storage: process.env.STORAGE_PROVIDER || "local",
      note: storageNote(),
      time: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        db: "down",
        error: e instanceof Error ? e.message : "db error",
      },
      { status: 503 }
    );
  }
}
