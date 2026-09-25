"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { advertisementImageExists, removeAdvertisementImage, storeAdvertisementImage, validateAdvertisementImage } from "@/lib/advertisement-image-storage";

export type AdState = { error?: string; success?: string };
const OFFSET = 330;
const text = (formData: FormData, name: string) => { const value = formData.get(name); return typeof value === "string" ? value.trim() : ""; };
function colomboDate(value: string) { if (!value) return null; const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value); if (!match) return undefined; const [, y, m, d, h, min] = match; const result = new Date(Date.UTC(+y, +m - 1, +d, +h, +min) - OFFSET * 60_000); return Number.isNaN(result.getTime()) ? undefined : result; }
export async function saveAdvertisement(id: string | null, _state: AdState, formData: FormData): Promise<AdState> {
  await requireAdmin();
  const title = text(formData, "title"), description = text(formData, "description"), order = text(formData, "displayOrder");
  const startsAt = colomboDate(text(formData, "startsAt")), endsAt = colomboDate(text(formData, "endsAt"));
  if (!title || title.length > 191 || description.length > 500 || !/^-?\d+$/.test(order)) return { error: "Check the title, description, and display order." };
  if (startsAt === undefined || endsAt === undefined || (startsAt && endsAt && startsAt > endsAt)) return { error: "Check the advertisement dates." };
  const existing = id ? await prisma.advertisement.findUnique({ where: { id }, select: { imageUrl: true } }) : null;
  if (id && !existing) return { error: "Advertisement not found." };
  const entry = formData.get("image"); let imageUrl = existing?.imageUrl ?? ""; let newKey: string | null = null;
  if (entry instanceof File && entry.size) { const error = validateAdvertisementImage(entry); if (error) return { error }; try { newKey = await storeAdvertisementImage(entry); imageUrl = newKey; } catch { return { error: "Image content is invalid or could not be stored." }; } }
  if (!imageUrl || (!newKey && !(await advertisementImageExists(imageUrl)))) return { error: "Choose a banner image. The previously stored image is unavailable." };
  let advertisementId: string;
  try {
    const data = { title, imageUrl, description: description || null, startsAt, endsAt, isActive: formData.get("isActive") === "on", displayOrder: Number(order) };
    const advertisement = id ? await prisma.advertisement.update({ where: { id }, data }) : await prisma.advertisement.create({ data });
    if (newKey && existing?.imageUrl) await removeIfUnreferenced(existing.imageUrl);
    advertisementId = advertisement.id;
    refresh(advertisement.id);
  } catch (error) { if (newKey) await removeAdvertisementImage(newKey); throw error; }
  if (!id) redirect(`/admin/advertisements/${advertisementId}?created=1`);
  return { success: "Advertisement saved successfully." };
}
export async function setAdvertisementActive(id: string, active: boolean, _state: AdState, _formData: FormData): Promise<AdState> { void _state; void _formData; await requireAdmin(); const result = await prisma.advertisement.updateMany({ where: { id }, data: { isActive: active } }); if (result.count !== 1) return { error: "Advertisement not found." }; refresh(id); return { success: active ? "Advertisement activated." : "Advertisement deactivated." }; }
export async function deleteAdvertisement(id: string, _state: AdState, _formData: FormData): Promise<AdState> { void _state; void _formData; await requireAdmin(); const advertisement = await prisma.advertisement.findUnique({ where: { id }, select: { imageUrl: true } }); if (!advertisement) return { error: "Advertisement not found." }; await prisma.advertisement.delete({ where: { id } }); await removeIfUnreferenced(advertisement.imageUrl); revalidatePath("/"); revalidatePath("/admin/advertisements"); redirect("/admin/advertisements?deleted=1"); }
async function removeIfUnreferenced(imageUrl: string) { if (await prisma.advertisement.count({ where: { imageUrl } }) === 0) await removeAdvertisementImage(imageUrl); }
function refresh(id: string) { revalidatePath("/"); revalidatePath("/admin/advertisements"); revalidatePath(`/admin/advertisements/${id}`); }
