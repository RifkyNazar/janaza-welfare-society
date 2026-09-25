"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import type { VehicleActionState } from "@/app/admin/(protected)/vehicles/actions";

export type VehicleFormValues = { name: string; vehicleNumber: string; vehicleType: string; description: string; displayOrder: number; isActive: boolean; isPublic: boolean };
const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function VehicleForm({ action, initial, submitLabel, currentImageSrc }: { action: (state: VehicleActionState, formData: FormData) => Promise<VehicleActionState>; initial: VehicleFormValues; submitLabel: string; currentImageSrc?: string | null }) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? initial;
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function selectImage(file?: File) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
    setFilename(file?.name ?? "");
    if (file) setRemoveImage(false);
  }

  function clearSelection() {
    selectImage();
    if (inputRef.current) inputRef.current.value = "";
  }

  return <form action={formAction} className="mt-7 space-y-6">
    <div className="grid gap-5 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2 sm:p-6">
      <div><label htmlFor="vehicle-name" className="text-sm font-semibold">Vehicle Name</label><input key={`n-${values.name}`} id="vehicle-name" name="name" required maxLength={150} autoComplete="off" defaultValue={values.name} className={inputClass} /></div>
      <div><label htmlFor="vehicle-number" className="text-sm font-semibold">Vehicle Number</label><input key={`no-${values.vehicleNumber}`} id="vehicle-number" name="vehicleNumber" required maxLength={100} autoComplete="off" defaultValue={values.vehicleNumber} className={inputClass} /></div>
      <div><label htmlFor="vehicle-type" className="text-sm font-semibold">Vehicle Type</label><input key={`t-${values.vehicleType}`} id="vehicle-type" name="vehicleType" required maxLength={120} autoComplete="off" defaultValue={values.vehicleType} className={inputClass} /></div>
      <div><label htmlFor="display-order" className="text-sm font-semibold">Display Order</label><input key={`o-${values.displayOrder}`} id="display-order" name="displayOrder" type="number" inputMode="numeric" step="1" required defaultValue={values.displayOrder} className={inputClass} /></div>
      <div className="sm:col-span-2"><label htmlFor="vehicle-description" className="text-sm font-semibold">Description <span className="font-normal text-muted">(optional)</span></label><textarea key={`d-${values.description}`} id="vehicle-description" name="description" maxLength={5000} rows={5} defaultValue={values.description} className={inputClass} /></div>

      <fieldset className="sm:col-span-2 rounded-2xl border border-border bg-light-background p-4 sm:p-5">
        <legend className="px-2 text-sm font-semibold">Vehicle Image <span className="font-normal text-muted">(optional)</span></legend>
        {currentImageSrc && !removeImage && !preview && <div className="mt-2"><p className="mb-3 text-sm font-semibold">Current Vehicle Image</p><div className="relative aspect-[16/10] max-w-xl overflow-hidden rounded-xl border border-border bg-white"><Image unoptimized src={currentImageSrc} alt="Current vehicle" fill sizes="(min-width: 640px) 576px, 100vw" className="object-contain" /></div></div>}
        {preview && <div className="mt-2"><p className="mb-3 text-sm font-semibold">Selected Image Preview</p><div className="relative aspect-[16/10] max-w-xl overflow-hidden rounded-xl border border-border bg-white"><Image unoptimized src={preview} alt="Selected vehicle preview" fill sizes="(min-width: 640px) 576px, 100vw" className="object-contain" /></div></div>}
        <div className="mt-4 flex flex-wrap gap-3">
          <label htmlFor="vehicle-image" className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-2 text-sm font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-foreground">{currentImageSrc ? "Change Image" : "Choose Image"}<input ref={inputRef} id="vehicle-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => selectImage(event.target.files?.[0])} /></label>
          {preview && <button type="button" onClick={clearSelection} className="min-h-11 rounded-xl border border-border bg-white px-5 py-2 text-sm font-semibold">Clear Selection</button>}
        </div>
        {filename && <p className="mt-3 break-all text-sm text-muted">Selected: {filename}</p>}
        <p className="mt-3 text-xs leading-5 text-muted">JPEG, PNG, or WEBP. Maximum 5 MB. File inputs are cleared after validation errors and must be selected again.</p>
        {currentImageSrc && <label className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-white p-4 text-sm"><input name="removeImage" type="checkbox" checked={removeImage} onChange={(event) => { setRemoveImage(event.target.checked); if (event.target.checked) clearSelection(); }} className="mt-0.5 size-5 accent-red-600" /><span><strong className="block text-red-800">Remove Image</strong><span className="mt-1 block text-muted">The vehicle record will remain. The stored image will be removed only after you save.</span></span></label>}
      </fieldset>

      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border p-4 text-sm font-semibold"><input key={`a-${values.isActive}`} name="isActive" type="checkbox" defaultChecked={values.isActive} className="size-5 accent-[#45E8CD]" />Active</label>
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border p-4 text-sm font-semibold"><input key={`p-${values.isPublic}`} name="isPublic" type="checkbox" defaultChecked={values.isPublic} className="size-5 accent-[#45E8CD]" />Public</label>
      <p className="sm:col-span-2 text-xs leading-5 text-muted">Deactivating a vehicle also hides it. Reactivating it does not make it public automatically.</p>
    </div>
    {state.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
    {state.success && <p role="status" className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">{state.success}</p>}
    <button disabled={pending} className="rounded-full bg-primary px-7 py-3 font-semibold text-foreground disabled:opacity-60">{pending ? "Saving..." : submitLabel}</button>
  </form>;
}
