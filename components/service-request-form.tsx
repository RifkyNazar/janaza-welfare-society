"use client";

import { useFormSubmission } from "@/components/use-form-submission";
import { T } from "@/components/public-language";


import { useActionState, useState } from "react";
import Link from "next/link";
import { submitServiceRequest, type ServiceRequestActionState } from "@/app/actions/service-request";
import { CopyRequestCode } from "@/components/copy-request-code";
import { DownloadRequestPdf } from "@/components/download-request-pdf";
import dynamic from "next/dynamic";
import { JANAZAH_SERVICE_OPTIONS, VEHICLE_SERVICE_OPTIONS, type PublicServiceCategory } from "@/lib/service-options";

const LocationPicker = dynamic(() => import("@/components/location-picker").then(module => module.LocationPicker), {
  loading: () => <div role="status" aria-busy="true" className="sm:col-span-2 flex min-h-[28rem] items-center justify-center rounded-2xl border border-border bg-light-background p-4"><T text="Interactive Map" /></div>,
});

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/20 motion-reduce:transition-none";

export function ServiceRequestForm() {
  const [category, setCategory] = useState<PublicServiceCategory | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [submission, formAction, isPending] = useActionState<ServiceRequestActionState, FormData>(submitServiceRequest, {});
  const form = useFormSubmission(submission, isPending);
  const fieldErrors = form.showFeedback ? submission.fieldErrors : undefined;
  const [details, setDetails] = useState({ requesterName: "", mobileNumber: "", area: "", note: "" });
  const options = category === "JANAZAH" ? JANAZAH_SERVICE_OPTIONS : VEHICLE_SERVICE_OPTIONS;
  const chooseCategory = (value: PublicServiceCategory) => { form.onChange(); setCategory(value); setSelected([]); };
  const chooseService = (code: string) => setSelected((current) => category === "VEHICLE" ? [code] : current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);

  if (submission.requestCode) return (
    <div className="rounded-3xl border border-primary/40 bg-white px-6 py-12 text-center shadow-[0_20px_60px_rgba(16,42,42,0.08)]" role="status" aria-live="polite">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/20 text-3xl" aria-hidden="true">✓</span>
      <h2 className="mt-5 text-3xl font-semibold"><T text="Request Received" /></h2>
      <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-primary/50 bg-light-background p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted"><T text="Request Code" /></p><p className="mt-2 break-all text-xl font-semibold sm:text-2xl">{submission.requestCode}</p></div>
      <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-border p-5 text-left"><p className="text-xs font-semibold uppercase tracking-wider text-muted"><T text="Selected Service(s)" /></p><p className="mt-2 text-sm font-medium">{submission.selectedServices?.map(label => <span key={label} className="mr-2"><T text={label} /></span>)}</p><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted"><T text="Status" /></p><p className="mt-1 text-sm font-medium"><T text="New / Received" /></p></div>
      <p className="mx-auto mt-5 max-w-lg text-sm text-muted"><T text="Keep this code and your mobile number private. You need both to track the request." /></p>
      <div className="mt-7 grid gap-3 sm:grid-cols-3"><CopyRequestCode requestCode={submission.requestCode} /><DownloadRequestPdf requestCode={submission.requestCode} pdfBase64={submission.pdfBase64} /><Link href="/track-request" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold"><T text="Track Request" /></Link></div>
    </div>
  );

  return <form action={formAction} onSubmit={form.onSubmit} onChange={form.onChange} noValidate className="jws-card p-4 sm:p-6">
    <fieldset className="min-w-0">
      <legend className="text-xl font-semibold"><T text="Choose Service Category" /></legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {([{ value: "JANAZAH", title: "Janazah Services", summary: "Kafan, Grave, Manji, Chair, Ghusl, Lighting" }, { value: "VEHICLE", title: "Vehicle Services", summary: "Janazah, Patient, Hospital Transportation" }] as const).map((item) => (
          <button key={item.value} type="button" disabled={isPending} className="jws-choice w-full text-start" aria-pressed={category === item.value} onClick={() => chooseCategory(item.value)}>
            <span aria-hidden="true" className="jws-choice-indicator" />
            <span><span className="block font-semibold"><T text={item.title} /></span><span className="block text-sm text-muted"><T text={item.summary} /></span></span>
          </button>
        ))}
      </div>
    </fieldset>

    {category && <fieldset className="mt-5 min-w-0">
      <legend className="text-xl font-semibold"><T text={category === "JANAZAH" ? "Choose one or more services" : "Choose one service"} /></legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option.code} className="jws-choice">
            <input disabled={isPending} type={category === "JANAZAH" ? "checkbox" : "radio"} name="serviceCodes" value={option.code} checked={selected.includes(option.code)} onChange={() => chooseService(option.code)} />
            <span><span className="block font-semibold"><T text={option.label} /></span><span className="block text-sm text-muted"><T text={option.description} /></span></span>
          </label>
        ))}
      </div>
    </fieldset>}

    {category && selected.length > 0 && <section className="mt-6 border-t border-border pt-5" aria-labelledby="details-heading"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary"><T text="Step 3" /></p><h2 id="details-heading" className="mt-2 text-2xl font-semibold"><T text="Contact & Location" /></h2><p className="mt-2 text-sm text-muted"><T text="Only the essentials are required." /></p>
      <input type="hidden" name="serviceCategory" value={category} />
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label htmlFor="requesterName" className="text-sm font-semibold"><T text="Name *" /></label><input disabled={isPending} id="requesterName" name="requesterName" required maxLength={150} autoComplete="name" value={details.requesterName} onChange={(e)=>setDetails({...details,requesterName:e.target.value})} aria-invalid={Boolean(fieldErrors?.requesterName)} aria-describedby={fieldErrors?.requesterName ? "requesterName-error" : undefined} className={inputClass} />{fieldErrors?.requesterName && <p id="requesterName-error" className="mt-2 text-sm text-red-700"><T text={fieldErrors.requesterName} /></p>}</div>
        <div><label htmlFor="mobileNumber" className="text-sm font-semibold"><T text="Contact Number *" /></label><input disabled={isPending} id="mobileNumber" name="mobileNumber" required maxLength={30} type="tel" inputMode="tel" enterKeyHint="next" autoComplete="tel" placeholder="e.g. 077 123 4567" value={details.mobileNumber} onChange={(e)=>setDetails({...details,mobileNumber:e.target.value})} aria-invalid={Boolean(fieldErrors?.mobileNumber)} aria-describedby={fieldErrors?.mobileNumber ? "mobileNumber-error" : undefined} className={inputClass} />{fieldErrors?.mobileNumber && <p id="mobileNumber-error" className="mt-2 text-sm text-red-700"><T text={fieldErrors.mobileNumber} /></p>}</div>
        <div><label htmlFor="area" className="text-sm font-semibold"><T text="Location / Area *" /></label><input disabled={isPending} id="area" name="area" required maxLength={150} autoComplete="address-level2" enterKeyHint="next" value={details.area} onChange={(e)=>setDetails({...details,area:e.target.value})} aria-invalid={Boolean(fieldErrors?.area)} aria-describedby={fieldErrors?.area ? "area-error" : undefined} className={inputClass} />{fieldErrors?.area && <p id="area-error" className="mt-2 text-sm text-red-700"><T text={fieldErrors.area} /></p>}</div>
        <div className="sm:col-span-2"><label htmlFor="note" className="text-sm font-semibold"><T text="Additional Note" /> <span className="font-normal text-muted"><T text="(optional)" /></span></label><textarea disabled={isPending} id="note" name="note" maxLength={191} rows={3} value={details.note} onChange={(e)=>setDetails({...details,note:e.target.value})} className={`${inputClass} min-h-24 resize-y`} /></div>
        <LocationPicker value={coordinates} onChange={value => { if (isPending) return; form.onChange(); setCoordinates(value); }} />
        <input type="hidden" name="latitude" value={coordinates?.latitude ?? ""} /><input type="hidden" name="longitude" value={coordinates?.longitude ?? ""} />
      </div>
      {form.showFeedback && submission.error && <p role="alert" aria-live="assertive" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><T text={submission.error} /></p>}
      <button type="submit" disabled={isPending} className="mt-7 min-h-12 w-full rounded-full bg-primary px-6 py-3 font-semibold shadow-[0_8px_24px_rgba(8,127,35,0.25)] transition hover:bg-[var(--primary)] disabled:opacity-60 motion-reduce:transition-none sm:w-auto"><T text={isPending ? "Submitting..." : "Submit Request"} /></button>
    </section>}
  </form>;
}
