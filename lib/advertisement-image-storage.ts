import "server-only";
import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
export const MAX_AD_IMAGE_BYTES = 5 * 1024 * 1024;
const directory = path.join(process.cwd(), ".data", "advertisements");
const formats = {
  "image/jpeg": { ext: ".jpg", match: (b: Uint8Array) => b[0]===0xff&&b[1]===0xd8&&b[2]===0xff },
  "image/png": { ext: ".png", match: (b: Uint8Array) => b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47&&b[4]===0x0d&&b[5]===0x0a&&b[6]===0x1a&&b[7]===0x0a },
  "image/webp": { ext: ".webp", match: (b: Uint8Array) => String.fromCharCode(...b.slice(0,4))==="RIFF"&&String.fromCharCode(...b.slice(8,12))==="WEBP" },
} as const;
const safe = (key: string) => /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key);
export function validateAdvertisementImage(file: File) { if (!file.size) return "Choose a banner image."; if (file.size>MAX_AD_IMAGE_BYTES) return "Image must be 5 MB or smaller."; if (!(file.type in formats)) return "Only JPEG, PNG, and WEBP images are allowed."; return null; }
export async function storeAdvertisementImage(file: File) { const f=formats[file.type as keyof typeof formats]; const bytes=new Uint8Array(await file.arrayBuffer()); if(!f.match(bytes)) throw new Error("INVALID_IMAGE_SIGNATURE"); await mkdir(directory,{recursive:true}); const key=`${randomUUID()}${f.ext}`; await writeFile(path.join(directory,key),bytes,{flag:"wx"}); return key; }
export async function readAdvertisementImage(key:string){if(!safe(key))return null;try{return await readFile(path.join(directory,key));}catch{return null;}}
export async function removeAdvertisementImage(key:string){if(safe(key))await unlink(path.join(directory,key)).catch(()=>undefined);}
export function advertisementImageMime(key:string){return key.endsWith(".jpg")?"image/jpeg":key.endsWith(".png")?"image/png":key.endsWith(".webp")?"image/webp":null;}
export async function advertisementImageExists(key:string){if(!safe(key))return false;try{await access(path.join(directory,key));return true;}catch{return false;}}
