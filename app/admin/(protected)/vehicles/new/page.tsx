import type { Metadata } from "next";
import Link from "next/link";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { createVehicle } from "../actions";
import { requireAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "Add Vehicle" };
export default async function NewVehiclePage() {
  await requireAdmin();
  return <div className="mx-auto max-w-4xl"><Link href="/admin/vehicles" className="inline-flex min-h-11 items-center rounded-full border border-primary/50 bg-white px-4 py-2 text-sm font-semibold hover:bg-primary/10">← Back to Vehicles</Link><p className="mt-6 text-sm font-semibold text-primary">Fleet management</p><h1 className="mt-1 text-3xl font-semibold">Add Vehicle</h1><VehicleForm action={createVehicle} submitLabel="Create Vehicle" initial={{ name: "", vehicleNumber: "", vehicleType: "", description: "", displayOrder: 0, isActive: true, isPublic: false }} /></div>;
}
