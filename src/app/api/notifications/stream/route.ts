import { getCurrentUser } from "@/lib/auth";
import { onNotify, sseResponse } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  return sseResponse((send) => onNotify(user.id, send));
}
