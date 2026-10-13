import { handle, ok, readJson, requireUser, str } from "@/lib/api";
import { moderate, type ModTarget } from "@/lib/services/moderation";

export const POST = handle(async (req: Request) => {
  const admin = await requireUser({ admin: true });
  const b = await readJson(req);
  await moderate(admin.id, str(b.targetType).toUpperCase() as ModTarget, str(b.targetId, 50), str(b.action), str(b.reason, 500), { hideTarget: !!b.hideTarget });
  return ok();
});
