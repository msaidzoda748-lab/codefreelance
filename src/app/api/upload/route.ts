import { prisma } from "@/lib/prisma";
import { ApiError, handle, ok, requireUser } from "@/lib/api";
import { ALLOWED_CHAT, ALLOWED_IMAGE, MAX_AVATAR_SIZE, MAX_FILE_SIZE, UploadError, saveUpload, type UploadKind } from "@/lib/uploads";

export const runtime = "nodejs";
const PRIVATE: UploadKind[] = ["proposals", "chat", "submissions"];
const ATTACH: UploadKind[] = ["projects", "proposals", "chat", "submissions"];

/**
 * Upload a file. Image kinds (avatars, covers, portfolio) are public.
 * Attachment kinds create an unlinked Attachment owned by the uploader; it is linked when the
 * message / proposal / submission / project is saved. Private attachments are served only via /api/files/[id].
 */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const form = await req.formData().catch(() => { throw new ApiError("invalid"); });
  const file = form.get("file");
  const kind = String(form.get("kind") || "") as UploadKind;
  if (!(file instanceof File)) throw new ApiError("invalid");
  if (!["avatars", "covers", "portfolio", ...ATTACH].includes(kind)) throw new ApiError("invalid");
  try {
    if (kind === "avatars" || kind === "covers" || kind === "portfolio") {
      const saved = await saveUpload(file, kind, { maxSize: kind === "avatars" ? MAX_AVATAR_SIZE : MAX_FILE_SIZE, allowed: ALLOWED_IMAGE });
      if (kind === "avatars") await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: saved.url } });
      if (kind === "covers" && user.profile) await prisma.freelancerProfile.update({ where: { userId: user.id }, data: { coverUrl: saved.url } });
      return ok({ url: saved.url, avatarUrl: saved.url });
    }
    const isPrivate = PRIVATE.includes(kind);
    const saved = await saveUpload(file, kind, { maxSize: MAX_FILE_SIZE, allowed: ALLOWED_CHAT, privateFile: isPrivate });
    const att = await prisma.attachment.create({ data: { uploaderId: user.id, url: saved.url, storageKey: saved.storageKey, name: saved.name.slice(0, 200), mimeType: saved.mimeType, size: saved.size, visibility: isPrivate ? "PRIVATE" : "PUBLIC" } });
    const url = isPrivate ? `/api/files/${att.id}` : saved.url;
    if (isPrivate) await prisma.attachment.update({ where: { id: att.id }, data: { url } });
    return ok({ attachment: { id: att.id, name: att.name, mimeType: att.mimeType, size: att.size, url } }, 201);
  } catch (e) {
    if (e instanceof UploadError) throw new ApiError("file_invalid", 400, { reason: e.message });
    throw e;
  }
});
