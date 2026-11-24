import "server-only";
import { MAX_UPLOAD_IMAGE_BYTES } from "./image-upload-limits";
import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const MAX_AD_IMAGE_BYTES = MAX_UPLOAD_IMAGE_BYTES;
const directory = process.env.JWS_ADVERTISEMENT_DIRECTORY || path.join(process.cwd(), ".data", "advertisements");
const safe = (key: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(key);

export function validateAdvertisementImage(file: File) {
  if (!file.size) return "Choose a banner image.";
  if (file.size > MAX_AD_IMAGE_BYTES) return "Image must be 5 MB or smaller.";
  return file.type && !["image/jpeg", "image/png", "image/webp", "application/octet-stream"].includes(file.type) ? "Only JPEG, PNG and WebP images are allowed." : null;
}

export async function storeAdvertisementImage(file: File) {
  const error = validateAdvertisementImage(file);
  if (error) throw new Error(error);
  const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000, failOn: "warning" });
  const metadata = await image.metadata();
  const mime = metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
  if (file.type && file.type !== "application/octet-stream" && file.type !== mime) throw new Error("The image type does not match its contents.");
  if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1) throw new Error("Unsupported image");
  const output = await image.rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
  const key = `${randomUUID()}.webp`;
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, key), output, { flag: "wx" });
  return key;
}

export async function readAdvertisementImage(key: string) {
  if (!safe(key)) return null;
  try { return await readFile(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ directory, key)); } catch { return null; }
}

export async function removeAdvertisementImage(key: string) {
  if (!safe(key)) return;
  try { await unlink(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ directory, key)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}

export function advertisementImageMime(key: string) {
  if (!safe(key)) return null;
  return key.endsWith(".jpg") ? "image/jpeg" : key.endsWith(".png") ? "image/png" : "image/webp";
}

export async function advertisementImageExists(key: string) {
  if (!safe(key)) return false;
  try { await access(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ directory, key)); return true; } catch { return false; }
}
