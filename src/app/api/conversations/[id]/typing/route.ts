import { handle, ok, readJson, requireUser } from "@/lib/api";
import { requireMember } from "@/lib/services/chat";
import { emitConv } from "@/lib/realtime";

export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  await requireMember(params.id, user.id);
  const b = await readJson(req);
  emitConv({ type: "typing", conversationId: params.id, userId: user.id, name: user.name, typing: !!b.typing });
  return ok();
});
