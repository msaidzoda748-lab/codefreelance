import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAttachment } from "@/lib/domain/authz";
import { readPrivate } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Authorized file delivery. Private files: only uploader, conversation members, proposal author/project owner, order participants, admins. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const a = await prisma.attachment.findUnique({
    where: { id: params.id },
    include: {
      message: { include: { conversation: { include: { members: { select: { userId: true } } } } } },
      proposal: { include: { project: { select: { clientId: true } } } },
      submission: { include: { milestone: { include: { order: { select: { clientId: true, freelancerId: true } } } } } },
    },
  });
  if (!a) return new Response("Not found", { status: 404 });
  const allowed = canAccessAttachment(user ? { id: user.id, isAdmin: user.isAdmin } : null, {
    visibility: a.visibility, uploaderId: a.uploaderId,
    conversationMembers: a.message?.conversation?.members.map((m) => m.userId),
    proposal: a.proposal ? { freelancerId: a.proposal.freelancerId, projectClientId: a.proposal.project.clientId } : null,
    order: a.submission?.milestone.order ?? null,
  });
  if (!allowed) return new Response(user ? "Forbidden" : "Unauthorized", { status: user ? 403 : 401 });
  if (!a.storageKey) {
    // legacy/public file stored at a public URL
    if (!a.url || a.url.startsWith("/api/files/")) return new Response("Not found", { status: 404 });
    return Response.redirect(new URL(a.url, _req.url), 302);
  }
  const bytes = await readPrivate(a.storageKey);
  if (!bytes) return new Response("File unavailable", { status: 410 });
  const inline = a.mimeType.startsWith("image/") || a.mimeType === "application/pdf";
  return new Response(bytes, {
    headers: {
      "Content-Type": a.mimeType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(a.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
