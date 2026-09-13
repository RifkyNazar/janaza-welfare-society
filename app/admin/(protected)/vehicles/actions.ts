"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export type VehicleActionState = { error?: string; success?: string };

const limits = { name: 150, vehicleNumber: 100, vehicleType: 120, description: 5000, imageUrl: 191 } as const;

function text(formData: FormData, name: string) {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry.trim() : "";
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function values(formData: FormData) {
  const name = text(formData, "name");
  const vehicleNumber = text(formData, "vehicleNumber");
  const vehicleType = text(formData, "vehicleType");
  const description = text(formData, "description");
  const imageUrl = text(formData, "imageUrl");
  const displayOrderInput = text(formData, "displayOrder") || "0";
  const isActive = checked(formData, "isActive");
  const requestedPublic = checked(formData, "isPublic");

  if (!name || !vehicleNumber || !vehicleType) return { error: "Please complete all required fields." } as const;
  if (name.length > limits.name || vehicleNumber.length > limits.vehicleNumber || vehicleType.length > limits.vehicleType || description.length > limits.description || imageUrl.length > limits.imageUrl) return { error: "One or more fields exceed the allowed length." } as const;
  if (!/^-?\d+$/.test(displayOrderInput)) return { error: "Display order must be a whole number." } as const;
  const displayOrder = Number(displayOrderInput);
  if (!Number.isSafeInteger(displayOrder)) return { error: "Display order must be a safe integer." } as const;
  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") return { error: "Image URL must use HTTP or HTTPS." } as const;
    } catch { return { error: "Please enter a valid image URL." } as const; }
  }
  if (requestedPublic && !isActive) return { error: "An inactive vehicle cannot be public. Activate it before making it public." } as const;

  return { data: { name, vehicleNumber, vehicleType, description: description || null, imageUrl: imageUrl || null, displayOrder, isActive, isPublic: isActive && requestedPublic } } as const;
}

function duplicate(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function refresh(id?: string) {
  revalidatePath("/vehicles");
  revalidatePath("/request-service");
  revalidatePath("/admin/vehicles");
  if (id) revalidatePath(`/admin/vehicles/${id}`);
}

export async function createVehicle(_state: VehicleActionState, formData: FormData): Promise<VehicleActionState> {
  void _state;
  await requireAdmin();
  const parsed = values(formData);
  if ("error" in parsed) return { error: parsed.error };
  try {
    const vehicle = await prisma.vehicle.create({ data: parsed.data });
    refresh(vehicle.id);
    redirect(`/admin/vehicles/${vehicle.id}?created=1`);
  } catch (error) {
    if (duplicate(error)) return { error: "A vehicle with this vehicle number already exists." };
    throw error;
  }
}

export async function updateVehicle(id: string, _state: VehicleActionState, formData: FormData): Promise<VehicleActionState> {
  void _state;
  await requireAdmin();
  if (!id || id.length > 191) return { error: "Invalid vehicle." };
  const parsed = values(formData);
  if ("error" in parsed) return { error: parsed.error };
  try {
    const existing = await prisma.vehicle.findUnique({ where: { id }, select: { isActive: true } });
    if (!existing) return { error: "Vehicle not found." };
    const activeChanged = existing.isActive !== parsed.data.isActive;
    await prisma.vehicle.update({ where: { id }, data: { ...parsed.data, isPublic: activeChanged ? false : parsed.data.isPublic } });
    refresh(id);
    return { success: "Changes saved." };
  } catch (error) {
    if (duplicate(error)) return { error: "A vehicle with this vehicle number already exists." };
    throw error;
  }
}
