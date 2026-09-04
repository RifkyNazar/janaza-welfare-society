import { prisma } from "@/lib/prisma";
import { readStoredTaskPhoto, taskPhotoMime } from "@/lib/task-photo-storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const value = (await params).id;
  if (!/^\d+$/.test(value)) return new Response(null, { status: 404 });
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) return new Response(null, { status: 404 });
  const selectedPhoto = await prisma.operationPhoto.findFirst({
    where: { id, operation: { is: { isPublished: true } }, taskPhoto: { is: { isApprovedForPublic: true } } },
    select: { taskPhoto: { select: { imageUrl: true } } },
  });
  if (!selectedPhoto) return new Response(null, { status: 404 });
  const mime = taskPhotoMime(selectedPhoto.taskPhoto.imageUrl);
  const bytes = mime ? await readStoredTaskPhoto(selectedPhoto.taskPhoto.imageUrl) : null;
  if (!mime || !bytes) return new Response(null, { status: 404 });
  return new Response(bytes, { headers: { "Content-Type": mime, "Content-Disposition": "inline", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
