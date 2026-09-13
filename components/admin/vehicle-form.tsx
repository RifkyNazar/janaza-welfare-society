"use client";

import { useActionState } from "react";
import type { VehicleActionState } from "@/app/admin/(protected)/vehicles/actions";

export type VehicleFormValues = { name: string; vehicleNumber: string; vehicleType: string; description: string; imageUrl: string; displayOrder: number; isActive: boolean; isPublic: boolean };
const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function VehicleForm({ action, initial, submitLabel }: { action: (state: VehicleActionState, formData: FormData) => Promise<VehicleActionState>; initial: VehicleFormValues; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="mt-7 space-y-6">
    <div className="grid gap-5 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2 sm:p-6">
      <div><label htmlFor="vehicle-name" className="text-sm font-semibold">Vehicle Name</label><input id="vehicle-name" name="name" required maxLength={150} defaultValue={initial.name} className={inputClass} /></div>
      <div><label htmlFor="vehicle-number" className="text-sm font-semibold">Vehicle Number</label><input id="vehicle-number" name="vehicleNumber" required maxLength={100} defaultValue={initial.vehicleNumber} className={inputClass} /></div>
      <div><label htmlFor="vehicle-type" className="text-sm font-semibold">Vehicle Type</label><input id="vehicle-type" name="vehicleType" required maxLength={120} defaultValue={initial.vehicleType} className={inputClass} /></div>
      <div><label htmlFor="display-order" className="text-sm font-semibold">Display Order</label><input id="display-order" name="displayOrder" type="number" step="1" required defaultValue={initial.displayOrder} className={inputClass} /></div>
      <div className="sm:col-span-2"><label htmlFor="vehicle-description" className="text-sm font-semibold">Description <span className="font-normal text-muted">(optional)</span></label><textarea id="vehicle-description" name="description" maxLength={5000} rows={5} defaultValue={initial.description} className={inputClass} /></div>
      <div className="sm:col-span-2"><label htmlFor="vehicle-image" className="text-sm font-semibold">Image URL <span className="font-normal text-muted">(optional, HTTP or HTTPS)</span></label><input id="vehicle-image" name="imageUrl" type="url" maxLength={191} placeholder="https://example.com/vehicle.jpg" defaultValue={initial.imageUrl} className={inputClass} /></div>
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border p-4 text-sm font-semibold"><input name="isActive" type="checkbox" defaultChecked={initial.isActive} className="size-5 accent-[#45E8CD]" />Active</label>
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border p-4 text-sm font-semibold"><input name="isPublic" type="checkbox" defaultChecked={initial.isPublic} className="size-5 accent-[#45E8CD]" />Public</label>
      <p className="sm:col-span-2 text-xs leading-5 text-muted">Deactivating a vehicle also hides it. Reactivating it does not make it public automatically.</p>
    </div>
    {state.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
    {state.success && <p role="status" className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">{state.success}</p>}
    <button disabled={pending} className="rounded-full bg-primary px-7 py-3 font-semibold text-foreground disabled:opacity-60">{pending ? "Saving..." : submitLabel}</button>
  </form>;
}
