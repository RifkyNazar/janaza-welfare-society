"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitServiceRequest, type ServiceRequestActionState } from "@/app/actions/service-request";
import { CopyRequestCode } from "@/components/copy-request-code";
import { DownloadRequestPdf } from "@/components/download-request-pdf";
import { LocationPicker } from "@/components/location-picker";
import { JANAZAH_SERVICE_OPTIONS, VEHICLE_SERVICE_OPTIONS, type PublicServiceCategory } from "@/lib/service-options";

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/20 motion-reduce:transition-none";

export function ServiceRequestForm() {
  const [category, setCategory] = useState<PublicServiceCategory | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [submission, formAction, isPending] = useActionState<ServiceRequestActionState, FormData>(submitServiceRequest, {});
  const [details, setDetails] = useState({ requesterName: "", mobileNumber: "", area: "", note: "" });
  const options = category === "JANAZAH" ? JANAZAH_SERVICE_OPTIONS : VEHICLE_SERVICE_OPTIONS;
  const chooseCategory = (value: PublicServiceCategory) => { setCategory(value); setSelected([]); };
  const chooseService = (code: string) => setSelected((current) => category === "VEHICLE" ? [code] : current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);

  if (submission.requestCode) return (
    <div className="rounded-3xl border border-primary/40 bg-white px-6 py-12 text-center shadow-[0_20px_60px_rgba(16,42,42,0.08)]" role="status" aria-live="polite">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/20 text-3xl" aria-hidden="true">✓</span>
      <h2 className="mt-5 text-3xl font-semibold">Request Received</h2>
      <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-primary/50 bg-light-background p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Request Code</p><p className="mt-2 break-all text-xl font-semibold sm:text-2xl">{submission.requestCode}</p></div>
      <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-border p-5 text-left"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Selected Service(s)</p><p className="mt-2 text-sm font-medium">{submission.selectedServices?.join(", ")}</p><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">Status</p><p className="mt-1 text-sm font-medium">New / Received</p></div>
      <p className="mx-auto mt-5 max-w-lg text-sm text-muted">Keep this code and your mobile number private. You need both to track the request.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-3"><CopyRequestCode requestCode={submission.requestCode} /><DownloadRequestPdf requestCode={submission.requestCode} pdfBase64={submission.pdfBase64} /><Link href="/track-request" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold">Track Request</Link></div>
    </div>
  );

  return <form action={formAction} noValidate className="rounded-3xl border border-border bg-white p-5 shadow-[0_20px_60px_rgba(16,42,42,0.08)] sm:p-8">
    <section aria-labelledby="category-heading"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Step 1</p><h2 id="category-heading" className="mt-2 text-2xl font-semibold">Choose Service Category</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{([{ value: "JANAZAH", title: "Janazah Services", summary: "Kafan, Grave, Manji, Chair, Ghusl, Lighting" }, { value: "VEHICLE", title: "Vehicle Services", summary: "Janazah, Patient, Hospital Transportation" }] as const).map((item) => <button key={item.value} type="button" onClick={() => chooseCategory(item.value)} aria-pressed={category === item.value} className={`min-h-32 rounded-2xl border-2 p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none ${category === item.value ? "border-primary bg-primary/15 shadow-[0_8px_24px_rgba(69,232,205,0.2)]" : "border-border hover:border-primary"}`}><span className="block text-lg font-semibold uppercase tracking-wide">{item.title}</span><span className="mt-2 block text-sm leading-6 text-muted">{item.summary}</span></button>)}</div>
    </section>

    {category && <section className="mt-9 border-t border-border pt-8" aria-labelledby="services-heading"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Step 2</p><h2 id="services-heading" className="mt-2 text-2xl font-semibold">Choose {category === "JANAZAH" ? "one or more services" : "one service"}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{options.map((option) => { const active = selected.includes(option.code); return <label key={option.code} className={`flex min-h-20 cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition motion-reduce:transition-none ${active ? "border-primary bg-primary/15" : "border-border hover:border-primary"}`}><input type={category === "JANAZAH" ? "checkbox" : "radio"} name="serviceCodes" value={option.code} checked={active} onChange={() => chooseService(option.code)} className="mt-1 size-5 shrink-0 accent-[#45E8CD]" /><span><span className="block font-semibold">{option.label}</span><span className="mt-1 block text-sm text-muted">{option.description}</span></span></label>; })}</div>
    </section>}

    {category && selected.length > 0 && <section className="mt-9 border-t border-border pt-8" aria-labelledby="details-heading"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Step 3</p><h2 id="details-heading" className="mt-2 text-2xl font-semibold">Contact & Location</h2><p className="mt-2 text-sm text-muted">Only the essentials are required.</p>
      <input type="hidden" name="serviceCategory" value={category} />
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label htmlFor="requesterName" className="text-sm font-semibold">Name *</label><input id="requesterName" name="requesterName" required maxLength={150} autoComplete="name" value={details.requesterName} onChange={(e)=>setDetails({...details,requesterName:e.target.value})} aria-invalid={Boolean(submission.fieldErrors?.requesterName)} aria-describedby={submission.fieldErrors?.requesterName ? "requesterName-error" : undefined} className={inputClass} />{submission.fieldErrors?.requesterName && <p id="requesterName-error" className="mt-2 text-sm text-red-700">{submission.fieldErrors.requesterName}</p>}</div>
        <div><label htmlFor="mobileNumber" className="text-sm font-semibold">Contact Number *</label><input id="mobileNumber" name="mobileNumber" required maxLength={30} type="tel" inputMode="tel" enterKeyHint="next" autoComplete="tel" placeholder="e.g. 077 123 4567" value={details.mobileNumber} onChange={(e)=>setDetails({...details,mobileNumber:e.target.value})} aria-invalid={Boolean(submission.fieldErrors?.mobileNumber)} aria-describedby={submission.fieldErrors?.mobileNumber ? "mobileNumber-error" : undefined} className={inputClass} />{submission.fieldErrors?.mobileNumber && <p id="mobileNumber-error" className="mt-2 text-sm text-red-700">{submission.fieldErrors.mobileNumber}</p>}</div>
        <div><label htmlFor="area" className="text-sm font-semibold">Location / Area *</label><input id="area" name="area" required maxLength={150} autoComplete="address-level2" enterKeyHint="next" value={details.area} onChange={(e)=>setDetails({...details,area:e.target.value})} aria-invalid={Boolean(submission.fieldErrors?.area)} aria-describedby={submission.fieldErrors?.area ? "area-error" : undefined} className={inputClass} />{submission.fieldErrors?.area && <p id="area-error" className="mt-2 text-sm text-red-700">{submission.fieldErrors.area}</p>}</div>
        <div className="sm:col-span-2"><label htmlFor="note" className="text-sm font-semibold">Additional Note <span className="font-normal text-muted">(optional)</span></label><textarea id="note" name="note" maxLength={2000} rows={3} value={details.note} onChange={(e)=>setDetails({...details,note:e.target.value})} className={`${inputClass} min-h-24 resize-y`} /></div>
        <LocationPicker value={coordinates} onChange={setCoordinates} />
        <input type="hidden" name="latitude" value={coordinates?.latitude ?? ""} /><input type="hidden" name="longitude" value={coordinates?.longitude ?? ""} />
      </div>
      {submission.error && <p role="alert" aria-live="assertive" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submission.error}</p>}
      <button type="submit" disabled={isPending} className="mt-7 min-h-12 w-full rounded-full bg-primary px-6 py-3 font-semibold shadow-[0_8px_24px_rgba(69,232,205,0.25)] transition hover:bg-[#35d8bd] disabled:opacity-60 motion-reduce:transition-none sm:w-auto">{isPending ? "Submitting..." : "Submit Request"}</button>
    </section>}
  </form>;
}
