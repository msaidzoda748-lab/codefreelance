import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") {
    return NextResponse.json(
      { error: "Танҳо фрилансерҳо метавонанд профилро таҳрир кунанд" },
      { status: 403 }
    );
  }
  return NextResponse.json({
    name: user.name,
    title: user.profile?.title || "",
    bio: user.profile?.bio || "",
    skills: user.profile?.skills || "",
    hourlyRate: user.profile?.hourlyRate || 10,
    portfolio: user.profile?.portfolio || "",
    avatarUrl: user.avatarUrl,
  });
}
