import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onProject } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function canAccess(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { proposals: { where: { status: "ACCEPTED" } } },
  });
  if (!project) return false;
  const accepted = project.proposals[0];
  return (
    project.clientId === userId ||
    (!!accepted && accepted.freelancerId === userId)
  );
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return new Response("projectId required", { status: 400 });
  if (!(await canAccess(user.id, projectId))) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };
      send({ type: "connected", projectId });
      cleanup = onProject(projectId, (event) => send(event));
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 25000);
    },
    cancel() {
      cleanup?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
