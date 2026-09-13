import type { Metadata } from "next";
import { BackButton } from "@/components/back-button";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { createVehicle } from "../actions";
import { requireAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "Add Vehicle" };
export default async function NewVehiclePage() {
  await requireAdmin();
  return <div className="mx-auto max-w-4xl"><BackButton fallbackHref="/admin/vehicles" /><p className="mt-6 text-sm font-semibold text-primary">Fleet management</p><h1 className="mt-1 text-3xl font-semibold">Add Vehicle</h1><VehicleForm action={createVehicle} submitLabel="Create Vehicle" initial={{ name: "", vehicleNumber: "", vehicleType: "", description: "", imageUrl: "", displayOrder: 0, isActive: true, isPublic: false }} /></div>;
}
