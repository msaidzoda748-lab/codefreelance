import { runDeadlineJob } from "@/lib/services/deadlines";

export const dynamic = "force-dynamic";
/** Scheduled job endpoint. Auth: `Authorization: Bearer $CRON_SECRET` (or ?secret=). Idempotent. */
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 503 });
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || new URL(req.url).searchParams.get("secret");
  if (given !== secret) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return Response.json({ ok: true, ...(await runDeadlineJob()) });
}
export const GET = run;
export const POST = run;
