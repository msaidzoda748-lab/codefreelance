import { ApiError, handle, ok, readJson, requireUser, str } from "@/lib/api";
import { milestoneAction } from "@/lib/services/orders";
import type { MilestoneAction } from "@/lib/domain/workflow";

const ACTIONS: MilestoneAction[] = ["start", "submit", "accept", "requestRevision", "cancel"];
export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const b = await readJson(req);
  const action = str(b.action) as MilestoneAction;
  if (!ACTIONS.includes(action)) throw new ApiError("invalid");
  return ok(await milestoneAction(user.id, params.id, action, { comment: str(b.comment, 3000), message: str(b.message, 5000), attachmentIds: Array.isArray(b.attachmentIds) ? b.attachmentIds.map(String) : [] }));
});
