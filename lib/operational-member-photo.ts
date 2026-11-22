import "server-only";
import sharp from "sharp";

export async function prepareMemberPhoto(file: File): Promise<Uint8Array<ArrayBuffer>> {
  if (!file.size || file.size > 5 * 1024 * 1024) throw new Error("Choose a member photo up to 5 MB.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPEG, PNG or WebP photo.");
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const image = sharp(bytes, { limitInputPixels: 40_000_000, failOn: "warning", animated: false });
    const metadata = await image.metadata();
    const expected = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" };
    if (metadata.format !== expected[file.type as keyof typeof expected] || (metadata.pages ?? 1) > 1) throw new Error("INVALID_IMAGE");
    // Re-encode without EXIF/location metadata; the database owns the durable bytes.
    const output = await image.rotate().resize({ width: 600, height: 750, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    if (output.length > 3 * 1024 * 1024) throw new Error("INVALID_IMAGE");
    return Uint8Array.from(output);
  } catch {
    throw new Error("The photo could not be read. Choose a valid JPEG, PNG or WebP image.");
  }
}
