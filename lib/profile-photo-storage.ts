import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const directory = path.join(process.cwd(), ".data", "profile-photos");
const formats = {
  "image/jpeg": { extension: ".jpg", matches: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { extension: ".png", matches: (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a },
  "image/webp": { extension: ".webp", matches: (b: Uint8Array) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP" },
} as const;
export function validateProfilePhoto(file: File) { if (!file.size) return null; if (file.size > MAX_PROFILE_PHOTO_BYTES) return "Profile photo must be 5 MB or smaller."; if (!(file.type in formats)) return "Only JPEG, PNG, and WEBP profile photos are allowed."; return null; }
export async function storeProfilePhoto(file: File) { const format = formats[file.type as keyof typeof formats]; const bytes = new Uint8Array(await file.arrayBuffer()); if (!format?.matches(bytes)) throw new Error("INVALID_IMAGE_SIGNATURE"); await mkdir(directory, { recursive: true }); const key = `${randomUUID()}${format.extension}`; await writeFile(path.join(directory, key), bytes, { flag: "wx" }); return key; }
export async function removeProfilePhoto(key: string | null) { if (!key || !isProfilePhotoKey(key)) return; await unlink(path.join(directory, key)).catch(() => undefined); }
export async function readProfilePhoto(key: string) { if (!isProfilePhotoKey(key)) return null; try { return await readFile(path.join(directory, key)); } catch { return null; } }
export function profilePhotoMime(key: string) { return key.endsWith(".jpg") ? "image/jpeg" : key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : null; }
export function isProfilePhotoKey(key: string) { return /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key); }
export function profilePhotoSrc(value: string | null) { return value && isProfilePhotoKey(value) ? `/profile-photos/${value}` : value; }
