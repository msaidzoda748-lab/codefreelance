import { handle, ok, readJson, requireUser, str } from "@/lib/api";
import { hireProposal } from "@/lib/services/orders";

/** Client hires a proposal → creates the Order (transaction, no double hire). */
export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser({ role: "CLIENT" });
  const b = await readJson(req);
  const order = await hireProposal(user.id, params.id, str(b.proposalId, 50));
  return ok({ orderId: order.id }, 201);
});
