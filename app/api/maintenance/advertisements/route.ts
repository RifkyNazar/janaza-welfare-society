import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cleanupExpiredAdvertisements } from "@/lib/advertisement-cleanup";

export async function POST(request: Request) {
  const secret = process.env.JWS_ADVERTISEMENT_CLEANUP_SECRET;
  if (!secret || secret.length < 32) return new Response(null, { status: 503 });
  const expected = Buffer.from("Bearer " + secret);
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return new Response(null, { status: 401 });
  const result = await cleanupExpiredAdvertisements();
  if (result.deleted) {
    revalidatePath("/");
    revalidatePath("/admin/advertisements");
    revalidatePath("/admin/advertisements/[id]", "page");
    revalidatePath("/advertisements/[id]", "page");
  }
  return Response.json(result, { status: result.failed ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
