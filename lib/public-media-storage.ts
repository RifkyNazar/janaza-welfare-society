import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Mount this directory outside the application release on the VPS.
const root = process.env.JWS_MEDIA_DIRECTORY || path.join(process.cwd(), ".data", "public-media");
export type MediaKind = "hero" | "activity";
const formats = {
  "image/jpeg": { extension: "jpg", matches: (b: Buffer) => b.length > 3 && b[0] === 255 && b[1] === 216 && b[2] === 255 },
  "image/png": { extension: "png", matches: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) },
  "image/webp": { extension: "webp", matches: (b: Buffer) => b.length >= 12 && b.toString("ascii",0,4) === "RIFF" && b.toString("ascii",8,12) === "WEBP" },
} as const;
export function mediaMime(key: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}\.(jpg|png|webp)$/.test(key)) return null;
  return key.endsWith(".jpg") ? "image/jpeg" : key.endsWith(".png") ? "image/png" : "image/webp";
}
export async function storePublicMedia(kind: MediaKind, file: File) {
  if (!file.size || file.size > 5 * 1024 * 1024) throw new Error("Choose an image up to 5 MB.");
  const format = formats[file.type as keyof typeof formats];
  if (!format) throw new Error("Only JPEG, PNG and WEBP are allowed.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!format.matches(bytes)) throw new Error("The image signature is invalid.");
  // Decode as well as checking signatures; cap dimensions to avoid oversized image payloads.
  const sharp = (await import("sharp")).default;
  const image = sharp(bytes, { limitInputPixels: 40000000, failOn: "warning" });
  await image.metadata();
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
