import "server-only";
import { MAX_UPLOAD_IMAGE_BYTES } from "./image-upload-limits";
import sharp from "sharp";

export async function prepareMemberPhoto(file: File): Promise<Uint8Array<ArrayBuffer>> {
  if (!file.size || file.size > MAX_UPLOAD_IMAGE_BYTES) throw new Error("Choose a member photo up to 5 MB.");
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: "warning", animated: false });
    const metadata = await image.metadata();
    const mime = metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
    if (file.type && file.type !== "application/octet-stream" && file.type !== mime) throw new Error("The image type does not match its contents.");
    const allowed = ["jpeg", "png", "webp"];
    if (!allowed.includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1) throw new Error("INVALID_IMAGE");
    // Re-encode without EXIF/location metadata; the database owns the durable bytes.
    const output = await image.rotate().resize({ width: 600, height: 750, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    if (output.length > 3 * 1024 * 1024) throw new Error("INVALID_IMAGE");
    return Uint8Array.from(output);
  } catch {
    throw new Error("The photo could not be read. Choose a valid JPEG, PNG or WebP image.");
  }
}
