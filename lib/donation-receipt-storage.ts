import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_DONATION_RECEIPT_BYTES = 5 * 1024 * 1024;

const storageDirectory = path.join(process.cwd(), ".data", "donation-receipts");
const formats = {
  "image/jpeg": { extension: ".jpg", matches: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: ".png", matches: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a },
  "image/webp": { extension: ".webp", matches: (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" },
  "application/pdf": { extension: ".pdf", matches: (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-" },
} as const;

export type DonationReceiptMime = keyof typeof formats;

export function validateDonationReceipt(file: File) {
  if (file.size === 0) return "Please attach the transfer receipt or proof.";
  if (file.size > MAX_DONATION_RECEIPT_BYTES) return "The receipt must be 5 MB or smaller.";
  if (!(file.type in formats)) return "Only JPEG, PNG, WEBP, and PDF receipts are allowed.";
  return null;
}

export async function storeDonationReceipt(file: File) {
  const format = formats[file.type as DonationReceiptMime];
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!format.matches(bytes)) throw new Error("INVALID_RECEIPT_SIGNATURE");
  await mkdir(storageDirectory, { recursive: true });
  const storageKey = `${randomUUID()}${format.extension}`;
  await writeFile(path.join(storageDirectory, storageKey), bytes, { flag: "wx" });
  return { storageKey, mimeType: file.type as DonationReceiptMime };
}

export async function removeDonationReceipt(storageKey: string) {
  if (!isSafeKey(storageKey)) return;
  await unlink(path.join(storageDirectory, storageKey)).catch(() => undefined);
}

export async function readDonationReceipt(storageKey: string) {
  if (!isSafeKey(storageKey)) return null;
  try { return await readFile(path.join(storageDirectory, storageKey)); } catch { return null; }
}

export function safeReceiptFileName(originalName: string, mimeType: DonationReceiptMime) {
  const base = path.basename(originalName).replace(/[^A-Za-z0-9._ -]/g, "_").replace(/\.[^.]*$/, "").trim().slice(0, 120) || "transfer-receipt";
  return `${base}${formats[mimeType].extension}`;
}

function isSafeKey(storageKey: string) {
  return /^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/.test(storageKey);
}
