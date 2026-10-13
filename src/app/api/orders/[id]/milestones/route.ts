import { handle, int, ok, readJson, requireUser, str } from "@/lib/api";
import { upsertMilestone } from "@/lib/services/orders";

/** Client adds (or edits, with id) a milestone. */
export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const b = await readJson(req);
  const amount = b.amount === "" || b.amount == null ? null : int(b.amount);
  const id = await upsertMilestone(user.id, params.id, { id: b.id ? str(b.id, 50) : undefined, title: str(b.title, 160), description: str(b.description, 3000), deadline: new Date(str(b.deadline, 30)), amount: amount != null && !isNaN(amount) ? amount : null });
  return ok({ id });
});
