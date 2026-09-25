import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { updateVehicle } from "@/app/admin/(protected)/vehicles/actions";
import { prisma } from "@/lib/prisma";
import { requireAdminOrSupervisor } from "@/lib/permissions";
export default async function SupervisorVehiclePage({ params }: { params: Promise<{id:string}> }) { await requireAdminOrSupervisor(); const id=(await params).id; if (!id || id.length>191) notFound(); const v=await prisma.vehicle.findUnique({where:{id}}); if(!v) notFound(); return <div className="mx-auto max-w-4xl"><BackButton fallbackHref="/supervisor/vehicles" label="Back to Vehicles"/><h1 className="mt-6 text-3xl font-semibold">{v.name}</h1><VehicleForm action={updateVehicle.bind(null,v.id)} submitLabel="Save Changes" initial={{name:v.name,vehicleNumber:v.vehicleNumber,vehicleType:v.vehicleType,description:v.description??"",imageUrl:v.imageUrl??"",displayOrder:v.displayOrder,isActive:v.isActive,isPublic:v.isPublic}}/></div>; }
