"use client";

import Image from "next/image";
import { useActionState } from "react";
import type { OperationActionState } from "@/app/admin/(protected)/operations/actions";

type Photo = { id: number; caption: string | null; selected?: boolean };
type InitialValues = { title: string; shortDescription: string; description: string; serviceType: string; area: string; operationDate: string };

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function OperationForm({ action, initial, photos, submitLabel }: { action: (state: OperationActionState, formData: FormData) => Promise<OperationActionState>; initial: InitialValues; photos: Photo[]; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? { ...initial, photoIds: photos.filter((photo) => photo.selected).map((photo) => photo.id) };
  return <form action={formAction} className="mt-7 space-y-6">
    <div className="grid gap-5 rounded-2xl border border-border bg-white p-5 sm:grid-cols-2 sm:p-6">
      <div className="sm:col-span-2"><label htmlFor="operation-title" className="text-sm font-semibold">Title</label><input key={`t-${values.title}`} id="operation-title" name="title" required maxLength={191} defaultValue={values.title} className={inputClass} /></div>
      <div className="sm:col-span-2"><label htmlFor="operation-short" className="text-sm font-semibold">Short Description</label><textarea key={`s-${values.shortDescription}`} id="operation-short" name="shortDescription" required maxLength={500} rows={3} defaultValue={values.shortDescription} className={inputClass} /></div>
      <div className="sm:col-span-2"><label htmlFor="operation-description" className="text-sm font-semibold">Full Description <span className="font-normal text-muted">(optional)</span></label><textarea key={`d-${values.description}`} id="operation-description" name="description" maxLength={10000} rows={7} defaultValue={values.description} className={inputClass} /></div>
      <div><label htmlFor="operation-service" className="text-sm font-semibold">Service Type</label><input key={`v-${values.serviceType}`} id="operation-service" name="serviceType" required maxLength={191} defaultValue={values.serviceType} className={inputClass} /></div>
      <div><label htmlFor="operation-area" className="text-sm font-semibold">Area</label><input key={`a-${values.area}`} id="operation-area" name="area" required maxLength={191} autoComplete="address-level2" defaultValue={values.area} className={inputClass} /></div>
      <div><label htmlFor="operation-date" className="text-sm font-semibold">Operation Date</label><input key={`o-${values.operationDate}`} id="operation-date" name="operationDate" type="date" required defaultValue={values.operationDate} className={inputClass} /></div>
    </div>
    <fieldset className="rounded-2xl border border-border bg-white p-5 sm:p-6"><legend className="px-2 text-lg font-semibold">Approved Public Photos</legend>{photos.length ? <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.map((photo) => { const selected = values.photoIds.includes(photo.id); return <label key={photo.id} className="cursor-pointer overflow-hidden rounded-2xl border border-border transition hover:border-primary"><Image unoptimized src={`/task-photos/${photo.id}`} alt={photo.caption || "Approved task photo"} width={640} height={480} className="aspect-[4/3] w-full object-cover" /><span className="flex items-start gap-3 p-4"><input key={`${photo.id}-${selected}`} type="checkbox" name="photoIds" value={photo.id} defaultChecked={selected} className="mt-0.5 size-5 accent-[#45E8CD]" /><span className="text-sm">{photo.caption || "No caption"}</span></span></label>; })}</div> : <p className="mt-3 rounded-xl bg-light-background p-5 text-sm text-muted">No approved public photos are available. You can create this operation without photos.</p>}</fieldset>
    {state.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
    <button disabled={pending} className="rounded-full bg-primary px-7 py-3 font-semibold text-foreground disabled:opacity-60">{pending ? "Saving..." : submitLabel}</button>
  </form>;
}
