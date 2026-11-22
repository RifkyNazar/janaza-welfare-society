import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { mediaMime, readPublicMedia } from "@/lib/public-media-storage";
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  await requireAdmin();
  const { kind, id: value } = await params;
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) return new Response(null, { status: 404 });
  const id = Number(value);
  const media = kind === "hero" ? await prisma.heroMedia.findUnique({ where: { id } }) : kind === "activity" ? await prisma.activityMedia.findUnique({ where: { id } }) : null;
  if (!media || (kind !== "hero" && kind !== "activity")) return new Response(null, { status: 404 });
  const bytes = await readPublicMedia(kind, media.storageKey);
  if (!bytes) return new Response(null, { status: 404 });
  return new Response(bytes, { headers: { "Content-Type": mediaMime(media.storageKey)!, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
