import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

export const ALLOWED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const ALLOWED_DOC = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
]);

export const ALLOWED_CHAT = new Set([...ALLOWED_IMAGE, ...ALLOWED_DOC]);

export type UploadKind = "avatars" | "projects" | "proposals" | "chat";

export type SavedFile = {
  url: string;
  name: string;
  mimeType: string;
  size: number;
};

function provider(): "local" | "cloudinary" | "s3" {
  const p = (process.env.STORAGE_PROVIDER || "local").toLowerCase();
  if (p === "cloudinary" || p === "s3") return p;
  return "local";
}

function extFor(mime: string) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  if (mime === "application/pdf") return ".pdf";
  if (mime.includes("word")) return ".docx";
  if (mime.includes("zip")) return ".zip";
  if (mime === "text/plain") return ".txt";
  return ".bin";
}

async function saveLocal(
  buf: Buffer,
  kind: UploadKind,
  filename: string
): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", kind);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), new Uint8Array(buf));
  return `/uploads/${kind}/${filename}`;
}

async function saveCloudinary(
  buf: Buffer,
  kind: UploadKind,
  filename: string,
  mime: string
): Promise<string> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) {
    throw new Error("Cloudinary env vars incomplete");
  }
  const folder = process.env.CLOUDINARY_FOLDER || `codefreelance/${kind}`;
  const resourceType = mime.startsWith("image/") ? "image" : "raw";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const { createHash } = await import("crypto");
  const toSign = `folder=${folder}&timestamp=${timestamp}${secret}`;
  const signature = createHash("sha1").update(toSign).digest("hex");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buf)], { type: mime }), filename);
  form.append("api_key", key);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/upload`,
    { method: "POST", body: form }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Cloudinary upload failed: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}

async function saveS3(
  buf: Buffer,
  kind: UploadKind,
  filename: string,
  mime: string
): Promise<string> {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || "auto";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.S3_ENDPOINT;
  const publicBase = process.env.S3_PUBLIC_URL;
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 env vars incomplete");
  }
  const client = new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: { accessKeyId, secretAccessKey },
  });
  const key = `${kind}/${filename}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buf,
      ContentType: mime,
      ACL: process.env.S3_ACL === "public-read" ? "public-read" : undefined,
    })
  );
  if (publicBase) return `${publicBase.replace(/\/$/, "")}/${key}`;
  if (endpoint) {
    return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function saveUpload(
  file: File,
  kind: UploadKind,
  opts?: { imagesOnly?: boolean; maxSize?: number; allowed?: Set<string> }
): Promise<SavedFile> {
  const maxSize = opts?.maxSize ?? MAX_FILE_SIZE;
  const allowed =
    opts?.allowed ?? (opts?.imagesOnly ? ALLOWED_IMAGE : ALLOWED_CHAT);

  if (!file || file.size === 0) throw new Error("Файл холӣ аст");
  if (file.size > maxSize) {
    throw new Error(
      `Андозаи файл аз ${Math.round(maxSize / 1024 / 1024)} МБ зиёд аст`
    );
  }
  const mime = file.type || "application/octet-stream";
  if (!allowed.has(mime)) {
    throw new Error("Намуди файл иҷозат дода нашудааст");
  }

  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${extFor(mime)}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const prov = provider();

  let url: string;
  if (prov === "cloudinary") {
    url = await saveCloudinary(buf, kind, filename, mime);
  } else if (prov === "s3") {
    url = await saveS3(buf, kind, filename, mime);
  } else {
    url = await saveLocal(buf, kind, filename);
  }

  return { url, name: file.name || filename, mimeType: mime, size: file.size };
}

export function storageNote() {
  const p = provider();
  if (p === "local") {
    return "Local disk storage — files are lost on Render free-tier restart unless you configure Cloudinary or S3.";
  }
  return `Using ${p} storage.`;
}
