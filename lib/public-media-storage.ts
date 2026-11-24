import "server-only";
import { MAX_UPLOAD_IMAGE_BYTES } from "./image-upload-limits";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Mount this directory outside the application release on the VPS.
const root = process.env.JWS_MEDIA_DIRECTORY || path.join(process.cwd(), ".data", "public-media");
export type MediaKind = "hero" | "activity";
export function mediaMime(key: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}\.(jpg|png|webp)$/.test(key)) return null;
  return key.endsWith(".jpg") ? "image/jpeg" : key.endsWith(".png") ? "image/png" : "image/webp";
}
export async function storePublicMedia(kind: MediaKind, file: File) {
  if (!file.size || file.size > MAX_UPLOAD_IMAGE_BYTES) throw new Error("Choose an image up to 5 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  // Decode as well as checking signatures; cap dimensions to avoid oversized image payloads.
  const sharp = (await import("sharp")).default;
  const image = sharp(bytes, { limitInputPixels: 40000000, failOn: "warning" });
  const metadata = await image.metadata();
  const mime = metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
  if (file.type && file.type !== "application/octet-stream" && file.type !== mime) throw new Error("The image type does not match its contents.");
  if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1) throw new Error("Choose a valid JPEG, PNG or WebP image.");
  const output = await image.rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  const directory = path.join(/* turbopackIgnore: true */ root, kind);
  await mkdir(directory, { recursive: true });
  const storageKey = `${randomUUID()}.webp`;
  await writeFile(path.join(directory, storageKey), output, { flag: "wx" });
  return storageKey;
}
export async function readPublicMedia(kind: MediaKind, key: string) {
  if (!mediaMime(key)) return null;
  try { return await readFile(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ root, kind, key)); } catch { return null; }
}
export async function removePublicMedia(kind: MediaKind, key: string) {
  if (mediaMime(key)) await unlink(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ root, kind, key)).catch(() => undefined);
}
