import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { vehicleImageSrc } from "@/lib/vehicle-image-storage";
import { updateVehicle } from "../actions";

export const metadata: Metadata = { title: "Manage Vehicle" };
export default async function VehicleDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!id || id.length > 191) notFound();
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) notFound();
  const query = await searchParams;
  return <div className="mx-auto max-w-4xl"><Link href="/admin/vehicles" className="inline-flex min-h-11 items-center rounded-full border border-primary/50 bg-white px-4 py-2 text-sm font-semibold hover:bg-primary/10">← Back to Vehicles</Link>{query.created === "1" && <p role="status" className="mt-6 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">Vehicle added successfully.</p>}<p className="mt-6 text-sm font-semibold text-primary">Fleet management</p><h1 className="mt-1 text-3xl font-semibold">{vehicle.name}</h1><p className="mt-2 text-sm text-muted">Vehicles are retained for request history and cannot be deleted.</p><VehicleForm action={updateVehicle.bind(null, vehicle.id)} submitLabel="Save Changes" currentImageSrc={vehicleImageSrc(vehicle.id, vehicle.imageUrl)} initial={{ name: vehicle.name, vehicleNumber: vehicle.vehicleNumber, vehicleType: vehicle.vehicleType, description: vehicle.description ?? "", displayOrder: vehicle.displayOrder, isActive: vehicle.isActive, isPublic: vehicle.isPublic }} /></div>;
}
