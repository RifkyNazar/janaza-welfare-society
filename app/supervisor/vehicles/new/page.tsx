import Link from "next/link";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { createVehicle } from "@/app/admin/(protected)/vehicles/actions";
import { requireAdminOrSupervisor } from "@/lib/permissions";
export default async function NewSupervisorVehiclePage() { await requireAdminOrSupervisor(); return <div className="mx-auto max-w-4xl"><Link href="/supervisor/vehicles" className="inline-flex min-h-11 items-center rounded-full border border-primary/50 bg-white px-4 py-2 text-sm font-semibold hover:bg-primary/10">← Back to Vehicles</Link><h1 className="mt-6 text-3xl font-semibold">Add Vehicle</h1><VehicleForm action={createVehicle} submitLabel="Create Vehicle" initial={{ name:"", vehicleNumber:"", vehicleType:"", description:"", displayOrder:0, isActive:true, isPublic:false }}/></div>; }
