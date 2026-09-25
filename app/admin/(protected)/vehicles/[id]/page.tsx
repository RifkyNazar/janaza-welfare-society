import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VehicleDeleteAction } from "@/components/admin/vehicle-delete-action";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { BackButton } from "@/components/back-button";
import { TaskAction } from "@/components/employee/task-action";
import { StatusMessage } from "@/components/status-message";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { vehicleImageSrc } from "@/lib/vehicle-image-storage";
import { deactivateVehicle, deleteVehicle, updateVehicle } from "../actions";

export const metadata: Metadata = { title: "Manage Vehicle" };

export default async function VehicleDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!id || id.length > 191) notFound();
  const vehicle = await prisma.vehicle.findUnique({ where: { id }, include: { _count: { select: { preferredRequests: true } } } });
  if (!vehicle) notFound();
  const query = await searchParams;
  const referenced = vehicle._count.preferredRequests > 0;

  return <div className="mx-auto max-w-4xl">
    <BackButton fallbackHref="/admin/vehicles" label="Back to Vehicles" />
    {query.created === "1" && <StatusMessage className="mt-6">Vehicle added successfully.</StatusMessage>}
    {query.created === "1" && <div className="mt-3 flex flex-wrap gap-3"><Link href="/admin/vehicles" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold">Back to Vehicles</Link><Link href="/admin" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold">Dashboard</Link><Link href="/vehicles" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold">View Website</Link></div>}
    <p className="mt-6 text-sm font-semibold text-primary">Fleet management</p>
    <h1 className="mt-1 text-3xl font-semibold">{vehicle.name}</h1>
    <VehicleForm action={updateVehicle.bind(null, vehicle.id)} submitLabel="Save Changes" currentImageSrc={vehicleImageSrc(vehicle.id, vehicle.imageUrl)} initial={{ name: vehicle.name, vehicleNumber: vehicle.vehicleNumber, vehicleType: vehicle.vehicleType, description: vehicle.description ?? "", displayOrder: vehicle.displayOrder, isActive: vehicle.isActive, isPublic: vehicle.isPublic }} />
    <section className="mt-8 rounded-2xl border border-red-200 bg-white p-5">
      <h2 className="text-lg font-semibold">Remove vehicle</h2>
      {referenced ? <>
        <p className="mt-2 text-sm leading-6 text-muted">This vehicle is referenced by {vehicle._count.preferredRequests} service request{vehicle._count.preferredRequests === 1 ? "" : "s"}. It cannot be permanently deleted because the history must be preserved.</p>
        <div className="mt-4"><TaskAction action={deactivateVehicle.bind(null, vehicle.id)} label="Deactivate / Hide from Public" confirmation="Deactivate this vehicle and hide it from public view? Historical records will remain." /></div>
      </> : <>
        <p className="mt-2 text-sm leading-6 text-muted">This vehicle has no request-history references and can be permanently deleted. Its stored image is removed only after the database deletion succeeds.</p>
        <div className="mt-4"><VehicleDeleteAction action={deleteVehicle.bind(null, vehicle.id)} /></div>
      </>}
    </section>
  </div>;
}
