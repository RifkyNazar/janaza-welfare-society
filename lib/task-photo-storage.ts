import "server-only";

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const MAX_TASK_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_TASK_PHOTO_CAPTION_LENGTH = 180;

const storageDirectory = path.join(process.cwd(), ".data", "task-photos");
const formats = {
  "image/jpeg": { extension: ".jpg", matches: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: ".png", matches: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a },
  "image/webp": { extension: ".webp", matches: (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" },
} as const;

export type AllowedTaskPhotoMime = keyof typeof formats;

export function validateTaskPhoto(file: File) {
  if (file.size === 0) return "Please choose an image.";
  if (file.size > MAX_TASK_PHOTO_BYTES) return "The image must be 5 MB or smaller.";
  if (!(file.type in formats)) return "Only JPEG, PNG, and WEBP images are allowed.";
  return null;
}

export async function storeTaskPhoto(file: File) {
  const format = formats[file.type as AllowedTaskPhotoMime];
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!format.matches(bytes)) throw new Error("INVALID_IMAGE_SIGNATURE");

  await mkdir(storageDirectory, { recursive: true });
  const storageKey = `${randomUUID()}${format.extension}`;
  await writeFile(path.join(storageDirectory, storageKey), bytes, { flag: "wx" });
  return storageKey;
}

export async function removeStoredTaskPhoto(storageKey: string) {
  if (!isSafeStorageKey(storageKey)) return;
  await unlink(path.join(storageDirectory, storageKey)).catch(() => undefined);
}

export async function readStoredTaskPhoto(storageKey: string) {
  if (!isSafeStorageKey(storageKey)) return null;
  try {
    return await readFile(path.join(storageDirectory, storageKey));
  } catch {
    return null;
  }
}

export function taskPhotoMime(storageKey: string) {
  if (storageKey.endsWith(".jpg")) return "image/jpeg";
  if (storageKey.endsWith(".png")) return "image/png";
  if (storageKey.endsWith(".webp")) return "image/webp";
  return null;
}

function isSafeStorageKey(storageKey: string) {
  return /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(storageKey);
}
