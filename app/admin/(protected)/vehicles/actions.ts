"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminOrSupervisor } from "@/lib/permissions";
import { removeVehicleImage, storeVehicleImage, validateVehicleImage } from "@/lib/vehicle-image-storage";

export type VehicleFormStateValues = { name: string; vehicleNumber: string; vehicleType: string; description: string; displayOrder: number; isActive: boolean; isPublic: boolean };
export type VehicleActionState = { error?: string; success?: string; values?: VehicleFormStateValues };

const limits = { name: 150, vehicleNumber: 100, vehicleType: 120, description: 5000 } as const;
const text = (formData: FormData, name: string) => { const entry = formData.get(name); return typeof entry === "string" ? entry.trim() : ""; };
const checked = (formData: FormData, name: string) => formData.get(name) === "on";

function values(formData: FormData) {
  const name = text(formData, "name"), vehicleNumber = text(formData, "vehicleNumber"), vehicleType = text(formData, "vehicleType"), description = text(formData, "description");
  const displayOrderInput = text(formData, "displayOrder") || "0", isActive = checked(formData, "isActive"), requestedPublic = checked(formData, "isPublic");
  const formValues = { name, vehicleNumber, vehicleType, description, displayOrder: Number(displayOrderInput) || 0, isActive, isPublic: requestedPublic };
  if (!name || !vehicleNumber || !vehicleType) return { error: "Please complete all required fields.", values: formValues } as const;
  if (name.length > limits.name || vehicleNumber.length > limits.vehicleNumber || vehicleType.length > limits.vehicleType || description.length > limits.description) return { error: "One or more fields exceed the allowed length.", values: formValues } as const;
  if (!/^-?\d+$/.test(displayOrderInput)) return { error: "Display order must be a whole number.", values: formValues } as const;
  const displayOrder = Number(displayOrderInput);
  if (!Number.isSafeInteger(displayOrder)) return { error: "Display order must be a safe integer.", values: formValues } as const;
  if (requestedPublic && !isActive) return { error: "An inactive vehicle cannot be public. Activate it before making it public.", values: formValues } as const;
  return { data: { name, vehicleNumber, vehicleType, description: description || null, displayOrder, isActive, isPublic: isActive && requestedPublic } } as const;
}

function imageFile(formData: FormData) { const entry = formData.get("image"); return entry instanceof File && entry.size ? entry : null; }
function duplicate(error: unknown) { return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"; }
function formDataToValues(formData: FormData): VehicleFormStateValues { return { name: text(formData, "name"), vehicleNumber: text(formData, "vehicleNumber"), vehicleType: text(formData, "vehicleType"), description: text(formData, "description"), displayOrder: Number(text(formData, "displayOrder")) || 0, isActive: checked(formData, "isActive"), isPublic: checked(formData, "isPublic") }; }
function refresh(id?: string) { revalidatePath("/"); revalidatePath("/vehicles"); revalidatePath("/request-service"); revalidatePath("/admin/vehicles"); revalidatePath("/supervisor/vehicles"); if (id) { revalidatePath(`/admin/vehicles/${id}`); revalidatePath(`/supervisor/vehicles/${id}`); revalidatePath(`/vehicle-images/${id}`); } }

export async function createVehicle(_state: VehicleActionState, formData: FormData): Promise<VehicleActionState> {
  void _state;
  const session = await requireAdminOrSupervisor();
  const parsed = values(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };
  const file = imageFile(formData);
  if (file) { const imageError = validateVehicleImage(file); if (imageError) return { error: imageError, values: formDataToValues(formData) }; }
  let newImageKey: string | null = null;
  let vehicleId: string;
  try {
    if (file) newImageKey = await storeVehicleImage(file);
    const vehicle = await prisma.vehicle.create({ data: { ...parsed.data, imageUrl: newImageKey } });
    vehicleId = vehicle.id;
  } catch (error) {
    if (newImageKey) await removeVehicleImage(newImageKey);
    if (duplicate(error)) return { error: "A vehicle with this vehicle number already exists.", values: formDataToValues(formData) };
    if (error instanceof Error && error.message === "INVALID_IMAGE_SIGNATURE") return { error: "The selected file is not a valid JPEG, PNG, or WEBP image.", values: formDataToValues(formData) };
    throw error;
  }
  refresh(vehicleId);
  redirect(`${session.user.role === "SUPERVISOR" ? "/supervisor/vehicles" : "/admin/vehicles"}/${vehicleId}?created=1`);
}

export async function updateVehicle(id: string, _state: VehicleActionState, formData: FormData): Promise<VehicleActionState> {
  void _state;
  await requireAdminOrSupervisor();
  if (!id || id.length > 191) return { error: "Invalid vehicle." };
  const parsed = values(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };
  const file = imageFile(formData), removeImage = checked(formData, "removeImage");
  if (file && removeImage) return { error: "Choose a replacement image or remove the current image, not both.", values: formDataToValues(formData) };
  if (file) { const imageError = validateVehicleImage(file); if (imageError) return { error: imageError, values: formDataToValues(formData) }; }
  const existing = await prisma.vehicle.findUnique({ where: { id }, select: { isActive: true, imageUrl: true } });
  if (!existing) return { error: "Vehicle not found." };
  let newImageKey: string | null = null;
  let success: string;
  try {
    if (file) newImageKey = await storeVehicleImage(file);
    const activeChanged = existing.isActive !== parsed.data.isActive;
    const imageUrl = newImageKey ?? (removeImage ? null : existing.imageUrl);
    await prisma.vehicle.update({ where: { id }, data: { ...parsed.data, imageUrl, isPublic: activeChanged ? false : parsed.data.isPublic } });
    success = newImageKey ? "Vehicle image updated successfully." : removeImage && existing.imageUrl ? "Vehicle image removed successfully." : "Vehicle updated successfully.";
  } catch (error) {
    if (newImageKey) await removeVehicleImage(newImageKey);
    if (duplicate(error)) return { error: "A vehicle with this vehicle number already exists.", values: formDataToValues(formData) };
    if (error instanceof Error && error.message === "INVALID_IMAGE_SIGNATURE") return { error: "The selected file is not a valid JPEG, PNG, or WEBP image.", values: formDataToValues(formData) };
    throw error;
  }
  if ((newImageKey || removeImage) && existing.imageUrl) await removeIfUnreferenced(existing.imageUrl);
  refresh(id);
  return { success };
}

async function removeIfUnreferenced(imageUrl: string) {
  try { if (await prisma.vehicle.count({ where: { imageUrl } }) === 0) await removeVehicleImage(imageUrl); } catch { /* Cleanup must not invalidate a successful vehicle update. */ }
}
