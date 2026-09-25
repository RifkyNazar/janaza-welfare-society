import { BackButton } from "@/components/back-button";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { createVehicle } from "@/app/admin/(protected)/vehicles/actions";
import { requireAdminOrSupervisor } from "@/lib/permissions";
export default async function NewSupervisorVehiclePage() { await requireAdminOrSupervisor(); return <div className="mx-auto max-w-4xl"><BackButton fallbackHref="/supervisor/vehicles" label="Back to Vehicles"/><h1 className="mt-6 text-3xl font-semibold">Add Vehicle</h1><VehicleForm action={createVehicle} submitLabel="Create Vehicle" initial={{ name:"", vehicleNumber:"", vehicleType:"", description:"", imageUrl:"", displayOrder:0, isActive:true, isPublic:false }}/></div>; }
