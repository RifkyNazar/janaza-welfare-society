"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { advertisementDateBoundary } from "@/lib/advertisement-schedule";
import { advertisementImageExists, removeAdvertisementImage, storeAdvertisementImage, validateAdvertisementImage } from "@/lib/advertisement-image-storage";
import { deleteAdvertisementRecord } from "@/lib/advertisement-cleanup";

export type AdState = { error?: string; success?: string; values?: { title: string; description: string; startsAt: string; endsAt: string } };

function refresh(id: string) {
  revalidatePath("/");
  revalidatePath("/admin/advertisements");
  revalidatePath(`/admin/advertisements/${id}`);
  revalidatePath(`/advertisements/${id}`);
}

export async function saveAdvertisement(id: string | null, _state: AdState, form: FormData): Promise<AdState> {
  await requireAdmin();
  const text = (field: string) => {
    const entry = form.get(field);
    return typeof entry === "string" ? entry.trim() : "";
  };
  const values = { title: text("title"), description: text("description"), startsAt: text("startsAt"), endsAt: text("endsAt") };
  const startsAt = advertisementDateBoundary(values.startsAt);
  const endsAt = advertisementDateBoundary(values.endsAt, true);
  if (!values.title || values.title.length > 191 || values.description.length > 500) return { error: "Check the heading and description.", values };
  if (!startsAt || !endsAt || startsAt > endsAt) return { error: "Enter a valid start and end date.", values };

  const existing = id ? await prisma.advertisement.findUnique({ where: { id }, select: { imageUrl: true, updatedAt: true } }) : null;
  if (id && !existing) return { error: "Advertisement not found.", values };
  const photo = form.get("image");
  let key: string | undefined;
  if (photo instanceof File && photo.size) {
    const error = validateAdvertisementImage(photo);
    if (error) return { error, values };
    try { key = await storeAdvertisementImage(photo); }
    catch (error) {
      console.error("[advertisements] Upload failed", error instanceof Error ? error.name : "unknown error");
      return { error: "Could not store the image. Choose a valid JPEG, PNG or WebP and try again.", values };
    }
  }
  const imageUrl = key ?? existing?.imageUrl;
  if (!imageUrl || (!key && !(await advertisementImageExists(imageUrl)))) return { error: "Choose a banner image.", values };

  let savedId: string;
  try {
    const data = { title: values.title, description: values.description || null, startsAt, endsAt, imageUrl, isActive: true };
    const saved = id && existing
      ? await prisma.advertisement.update({ where: { id, updatedAt: existing.updatedAt, imageUrl: existing.imageUrl }, data })
      : await prisma.advertisement.create({ data });
    savedId = saved.id;
  } catch (error) {
    if (key) await removeAdvertisementImage(key).catch(() => console.error("[advertisements] Could not remove failed upload."));
    console.error("[advertisements] Save failed", error instanceof Error ? error.name : "unknown error");
    return { error: "Unable to save this advertisement. Check whether it has changed and try again.", values };
  }
  if (key && existing) {
    try {
      if (!(await prisma.advertisement.count({ where: { imageUrl: existing.imageUrl } }))) await removeAdvertisementImage(existing.imageUrl);
    } catch {
      console.error("[advertisements] Could not remove previous upload.");
    }
  }
  refresh(savedId);
  if (!id) redirect(`/admin/advertisements/${savedId}?created=1`);
  return { success: "Advertisement saved successfully." };
}

export async function deleteAdvertisement(id: string, _state: AdState, _form: FormData): Promise<AdState> {
  void _state;
  void _form;
  await requireAdmin();
  try {
    if (!(await deleteAdvertisementRecord(id))) return { error: "Advertisement not found." };
  } catch {
    return { error: "Advertisement deletion failed. Please try again." };
  }
  refresh(id);
  redirect(`/admin/advertisements?deleted=1&change=${encodeURIComponent(id)}`);
}
