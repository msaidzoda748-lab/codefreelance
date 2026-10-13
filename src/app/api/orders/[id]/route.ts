import { ApiError, handle, ok, readJson, requireUser, str } from "@/lib/api";
import { orderAction } from "@/lib/services/orders";

/** Order actions: start (freelancer, from NEGOTIATION) | cancel (client). */
export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const b = await readJson(req);
  const action = str(b.action);
  if (action !== "start" && action !== "cancel") throw new ApiError("invalid");
  return ok(await orderAction(user.id, params.id, action, str(b.reason, 500)));
});
