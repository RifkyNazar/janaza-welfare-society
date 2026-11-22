"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { removePublicMedia, storePublicMedia, type MediaKind } from "@/lib/public-media-storage";

export type MediaState = { error?: string; success?: string };
export async function saveMedia(kind: MediaKind, operationId: number | null, id: number | null, _state: MediaState, data: FormData): Promise<MediaState> {
  await requireAdmin();
  if (kind !== "hero" && kind !== "activity") return { error: "Invalid media type." };
  if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) return { error: "Invalid media." };
  if (kind === "activity") {
    if (!operationId || !Number.isSafeInteger(operationId)) return { error: "Invalid activity." };
    const operation = await prisma.operation.findFirst({ where: { id: operationId, source: "MANUAL", taskAssignmentId: null }, select: { id: true } });
    if (!operation) return { error: "Manual activity not found." };
  }
  const current = id ? kind === "hero" ? await prisma.heroMedia.findUnique({ where: { id } }) : await prisma.activityMedia.findFirst({ where: { id, operationId: operationId! } }) : null;
  if (id && !current) return { error: "Media not found." };
  if (data.get("intent") === "remove") {
    if (!current) return { error: "Media not found." };
    if (kind === "hero") await prisma.heroMedia.delete({ where: { id: current.id } });
    else await prisma.activityMedia.delete({ where: { id: current.id } });
    await removePublicMedia(kind, current.storageKey);
    refresh(operationId);
    if (kind === "activity") redirect(`/admin/operations/${operationId}?photoRemoved=1#activity-photos`);
    return { success: "Image removed." };
  }
  const altText = String(data.get("altText") || "").trim();
  const caption = String(data.get("caption") || "").trim();
  const displayOrder = Number(data.get("displayOrder"));
  if (!altText || altText.length > 180 || caption.length > 500 || !Number.isSafeInteger(displayOrder) || Math.abs(displayOrder) > 100000) return { error: "Enter alt text (up to 180 characters), caption (up to 500), and a valid order." };
  const file = data.get("image");
  let newKey: string | null = null;
  try {
    if (file instanceof File && file.size) newKey = await storePublicMedia(kind, file);
    if (!current && !newKey) return { error: "Choose an image." };
    const fields = { altText, caption: caption || null, displayOrder, storageKey: newKey || current!.storageKey };
    const enabled = data.get("enabled") === "on";
    if (kind === "hero") {
      if (current) {
        const result = await prisma.heroMedia.updateMany({
          where: { id: current.id, storageKey: current.storageKey },
          data: { ...fields, isActive: enabled },
        });
        if (result.count !== 1) {
          if (newKey) await removePublicMedia(kind, newKey);
          return { error: "This image changed or was removed. Refresh before saving again." };
        }
      } else await prisma.heroMedia.create({ data: { ...fields, isActive: enabled } });
    } else {
      if (current) await prisma.activityMedia.update({ where: { id: current.id }, data: { ...fields, isPublic: enabled } });
      else await prisma.activityMedia.create({ data: { ...fields, operationId: operationId!, isPublic: enabled } });
    }
  } catch (error) {
    if (newKey) await removePublicMedia(kind, newKey);
    return { error: error instanceof Error && /image|JPEG|signature/i.test(error.message) ? error.message : "Unable to save image. Please try again." };
  }
  if (current && newKey) await removePublicMedia(kind, current.storageKey);
  refresh(operationId);
  return { success: "Image saved." };
}
function refresh(id: number | null) {
  revalidatePath("/"); revalidatePath("/operations"); revalidatePath("/admin/hero-media");
  if (id) { revalidatePath(`/operations/${id}`); revalidatePath(`/admin/operations/${id}`); }
}
