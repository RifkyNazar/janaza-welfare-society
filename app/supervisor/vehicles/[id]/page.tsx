import Link from "next/link";
import { notFound } from "next/navigation";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { updateVehicle } from "@/app/admin/(protected)/vehicles/actions";
import { prisma } from "@/lib/prisma";
import { requireAdminOrSupervisor } from "@/lib/permissions";
import { vehicleImageSrc } from "@/lib/vehicle-image-storage";
export default async function SupervisorVehiclePage({ params, searchParams }: { params: Promise<{id:string}>; searchParams: Promise<{created?:string}> }) { await requireAdminOrSupervisor(); const id=(await params).id; if (!id || id.length>191) notFound(); const v=await prisma.vehicle.findUnique({where:{id}}); if(!v) notFound(); const query=await searchParams; return <div className="mx-auto max-w-4xl"><Link href="/supervisor/vehicles" className="inline-flex min-h-11 items-center rounded-full border border-primary/50 bg-white px-4 py-2 text-sm font-semibold hover:bg-primary/10">← Back to Vehicles</Link>{query.created==="1"&&<p role="status" className="mt-6 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">Vehicle added successfully.</p>}<h1 className="mt-6 text-3xl font-semibold">{v.name}</h1><VehicleForm action={updateVehicle.bind(null,v.id)} submitLabel="Save Changes" currentImageSrc={vehicleImageSrc(v.id,v.imageUrl)} initial={{name:v.name,vehicleNumber:v.vehicleNumber,vehicleType:v.vehicleType,description:v.description??"",displayOrder:v.displayOrder,isActive:v.isActive,isPublic:v.isPublic}}/></div>; }
