import "server-only";

import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_VEHICLE_IMAGE_BYTES = 5 * 1024 * 1024;

const directory = path.join(process.cwd(), ".data", "vehicle-images");
const formats = {
  "image/jpeg": { extension: ".jpg", matches: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: ".png", matches: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a },
  "image/webp": { extension: ".webp", matches: (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" },
} as const;

export function isVehicleImageKey(value: string) {
  return /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(value);
}

export function vehicleImageSrc(vehicleId: string, value: string | null) {
  return value && isVehicleImageKey(value) ? `/vehicle-images/${vehicleId}` : value;
}

export function validateVehicleImage(file: File) {
  if (!file.size) return null;
  if (file.size > MAX_VEHICLE_IMAGE_BYTES) return "Vehicle image must be 5 MB or smaller.";
  if (!(file.type in formats)) return "Only JPEG, PNG, and WEBP vehicle images are allowed.";
  return null;
}

export async function storeVehicleImage(file: File) {
  const format = formats[file.type as keyof typeof formats];
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!format?.matches(bytes)) throw new Error("INVALID_IMAGE_SIGNATURE");
  await mkdir(directory, { recursive: true });
  const key = `${randomUUID()}${format.extension}`;
  await writeFile(path.join(directory, key), bytes, { flag: "wx" });
  return key;
}

export async function readVehicleImage(key: string) {
  if (!isVehicleImageKey(key)) return null;
  try { return await readFile(path.join(directory, key)); } catch { return null; }
}

export async function removeVehicleImage(key: string | null) {
  if (!key || !isVehicleImageKey(key)) return;
  await unlink(path.join(directory, key)).catch(() => undefined);
}

export async function vehicleImageExists(key: string) {
  if (!isVehicleImageKey(key)) return false;
  try { await access(path.join(directory, key)); return true; } catch { return false; }
}

export function vehicleImageMime(key: string) {
  return key.endsWith(".jpg") ? "image/jpeg" : key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : null;
}
