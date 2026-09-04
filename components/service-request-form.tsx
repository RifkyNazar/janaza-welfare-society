"use client";

import { FormEvent, useActionState, useState } from "react";
import Link from "next/link";
import { submitServiceRequest, type ServiceRequestActionState } from "@/app/actions/service-request";
import { CopyRequestCode } from "@/components/copy-request-code";
import { DownloadRequestPdf } from "@/components/download-request-pdf";
import { LocationPicker } from "@/components/location-picker";

type RequestFormData = {
  fullName: string;
  mobile: string;
  alternative: string;
  relationship: string;
  serviceType: string;
  requiredDate: string;
  requiredTime: string;
  placeType: string;
  note: string;
  address: string;
  area: string;
  hospitalName: string;
};

type FieldName = keyof RequestFormData;
type Errors = Partial<Record<FieldName, string>>;

const initialData: RequestFormData = {
  fullName: "", mobile: "", alternative: "", relationship: "",
  serviceType: "", requiredDate: "", requiredTime: "", placeType: "",
  note: "", address: "", area: "", hospitalName: "",
};

const steps = ["Contact", "Service", "Location", "Review"] as const;
const serviceOptions = [
  { value: "service-a", label: "Service Option A" },
  { value: "service-b", label: "Service Option B" },
  { value: "service-c", label: "Service Option C" },
] as const;

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/20 motion-reduce:transition-none";
const labelClass = "block text-sm font-semibold text-foreground";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p id={id} className="mt-2 text-sm font-medium text-red-700" role="alert">{message}</p>;
}

export function ServiceRequestForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<RequestFormData>(initialData);
  const [errors, setErrors] = useState<Errors>({});
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [submission, formAction, isPending] = useActionState<ServiceRequestActionState, FormData>(submitServiceRequest, {});

  const update = (field: FieldName, value: string) => {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (field === "placeType" && value !== "Hospital") {
      setData((current) => ({ ...current, placeType: value, hospitalName: "" }));
    }
  };

  const validateStep = () => {
    const nextErrors: Errors = {};
    const phonePattern = /^[+]?[0-9][0-9\s-]{7,14}$/;

    if (step === 1) {
      if (!data.fullName.trim()) nextErrors.fullName = "Please enter your full name.";
      if (!data.mobile.trim()) nextErrors.mobile = "Please enter your mobile number.";
      else if (!phonePattern.test(data.mobile.trim())) nextErrors.mobile = "Enter a valid phone number.";
      if (data.alternative.trim() && !phonePattern.test(data.alternative.trim())) nextErrors.alternative = "Enter a valid phone number.";
    }
    if (step === 2) {
      if (!data.serviceType) nextErrors.serviceType = "Please choose a service type.";
      if (!data.requiredDate) nextErrors.requiredDate = "Please choose the required date.";
      if (!data.placeType) nextErrors.placeType = "Please choose a place type.";
    }
    if (step === 3) {
      if (!data.address.trim()) nextErrors.address = "Please enter the address.";
      if (!data.area.trim()) nextErrors.area = "Please enter the area or town.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((current) => Math.min(current + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const previousStep = () => {
    setErrors({});
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (step < 4) {
      event.preventDefault();
      nextStep();
    }
  };

  if (submission.requestCode) {
    return (
      <div className="rounded-3xl border border-primary/40 bg-white px-6 py-14 text-center shadow-[0_20px_60px_rgba(16,42,42,0.08)]" role="status" aria-live="polite">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/20 text-foreground" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className="size-8"><path d="m6 12 4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
        <h2 className="mt-5 text-2xl font-semibold text-foreground">Your service request has been submitted successfully.</h2>
        <h3 className="mt-6 text-lg font-semibold text-foreground">Keep this code safe</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">You will need this request code together with your registered mobile number to track your request.</p>
        <div className="mx-auto mt-5 max-w-lg rounded-2xl border border-primary/50 bg-light-background px-4 py-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Request Code</p><p className="mt-2 break-all text-xl font-semibold tracking-wide text-foreground sm:text-2xl">{submission.requestCode}</p></div>
        <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-border bg-light-background p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Current Status</p><p className="mt-2 font-semibold text-foreground">Request Received</p></div>
        <p className="mx-auto mt-5 max-w-lg text-sm font-medium leading-6 text-muted">This PDF contains your request details. Keep it private.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3"><CopyRequestCode requestCode={submission.requestCode} /><DownloadRequestPdf requestCode={submission.requestCode} pdfBase64={submission.pdfBase64} /><Link href="/track-request" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-foreground transition-colors hover:bg-[#35d8bd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">Track Request</Link></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_20px_60px_rgba(16,42,42,0.08)]">
      <nav className="border-b border-border bg-light-background/70 px-4 py-5 sm:px-8" aria-label="Request progress">
        <ol className="grid grid-cols-4 gap-1 sm:gap-3">
          {steps.map((label, index) => {
            const number = index + 1;
            const active = step === number;
            const complete = step > number;
            return (
              <li key={label} className="relative text-center" aria-current={active ? "step" : undefined}>
                {index < steps.length - 1 && <span className={`absolute left-[58%] top-4 h-px w-[84%] ${complete ? "bg-primary" : "bg-border"}`} aria-hidden="true" />}
                <span className={`relative mx-auto flex size-8 items-center justify-center rounded-full border text-sm font-bold ${active || complete ? "border-primary bg-primary text-foreground" : "border-border bg-white text-muted"}`}>
                  {complete ? <span aria-label="Completed">✓</span> : number}
                </span>
                <span className={`mt-2 block text-[11px] font-semibold sm:text-sm ${active ? "text-foreground" : "text-muted"}`}>{label}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      <form action={formAction} onSubmit={handleSubmit} noValidate className="p-5 sm:p-8 md:p-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Step {step} of 4</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">{step === 1 ? "Requester Details" : step === 2 ? "Service Details" : step === 3 ? "Location" : "Review & Submit"}</h2>
          <p className="mt-2 text-sm text-muted">{step === 4 ? "Please confirm the information before continuing." : "Fields marked with an asterisk are required."}</p>
        </div>

        {step === 1 && <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={labelClass} htmlFor="fullName">Full Name <span className="text-red-700" aria-hidden="true">*</span></label><input className={inputClass} id="fullName" name="fullName" autoComplete="name" value={data.fullName} onChange={(e) => update("fullName", e.target.value)} aria-required="true" aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? "fullName-error" : undefined} /><FieldError id="fullName-error" message={errors.fullName} /></div>
          <div><label className={labelClass} htmlFor="mobile">Mobile Number <span className="text-red-700" aria-hidden="true">*</span></label><input className={inputClass} id="mobile" name="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="e.g. 077 123 4567" value={data.mobile} onChange={(e) => update("mobile", e.target.value)} aria-required="true" aria-invalid={!!errors.mobile} aria-describedby={errors.mobile ? "mobile-error" : undefined} /><FieldError id="mobile-error" message={errors.mobile} /></div>
          <div><label className={labelClass} htmlFor="alternative">Alternative Number <span className="font-normal text-muted">(optional)</span></label><input className={inputClass} id="alternative" name="alternative" type="tel" inputMode="tel" value={data.alternative} onChange={(e) => update("alternative", e.target.value)} aria-invalid={!!errors.alternative} aria-describedby={errors.alternative ? "alternative-error" : undefined} /><FieldError id="alternative-error" message={errors.alternative} /></div>
          <div className="sm:col-span-2"><label className={labelClass} htmlFor="relationship">Relationship to the deceased <span className="font-normal text-muted">(optional)</span></label><input className={inputClass} id="relationship" name="relationship" value={data.relationship} onChange={(e) => update("relationship", e.target.value)} /></div>
        </div>}

        {step === 2 && <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={labelClass} htmlFor="serviceType">Service Type <span className="text-red-700" aria-hidden="true">*</span></label><select className={inputClass} id="serviceType" name="serviceType" value={data.serviceType} onChange={(e) => update("serviceType", e.target.value)} aria-required="true" aria-invalid={!!errors.serviceType} aria-describedby={errors.serviceType ? "serviceType-error" : undefined}><option value="">Select a service</option>{serviceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><FieldError id="serviceType-error" message={errors.serviceType} /><p className="mt-2 text-xs text-muted">Temporary service options — to be replaced with the society&apos;s service list.</p></div>
          <div><label className={labelClass} htmlFor="requiredDate">Required Date <span className="text-red-700" aria-hidden="true">*</span></label><input className={inputClass} id="requiredDate" name="requiredDate" type="date" value={data.requiredDate} onChange={(e) => update("requiredDate", e.target.value)} aria-required="true" aria-invalid={!!errors.requiredDate} aria-describedby={errors.requiredDate ? "requiredDate-error" : undefined} /><FieldError id="requiredDate-error" message={errors.requiredDate} /></div>
          <div><label className={labelClass} htmlFor="requiredTime">Required Time <span className="font-normal text-muted">(optional)</span></label><input className={inputClass} id="requiredTime" name="requiredTime" type="time" value={data.requiredTime} onChange={(e) => update("requiredTime", e.target.value)} /></div>
          <fieldset className="sm:col-span-2" aria-invalid={!!errors.placeType} aria-describedby={errors.placeType ? "placeType-error" : undefined}><legend className={labelClass}>Place Type <span className="text-red-700" aria-hidden="true">*</span></legend><div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">{["Home", "Hospital", "Other"].map((place) => <label key={place} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 font-medium transition focus-within:ring-4 focus-within:ring-primary/20 ${data.placeType === place ? "border-primary bg-primary/10" : "border-border bg-white hover:border-primary"}`}><input type="radio" name="placeType" value={place} checked={data.placeType === place} onChange={(e) => update("placeType", e.target.value)} className="size-5 accent-[#45E8CD]" />{place}</label>)}</div><FieldError id="placeType-error" message={errors.placeType} /></fieldset>
          <div className="sm:col-span-2"><label className={labelClass} htmlFor="note">Short Note <span className="font-normal text-muted">(optional)</span></label><textarea className={`${inputClass} min-h-28 resize-y`} id="note" name="note" rows={3} value={data.note} onChange={(e) => update("note", e.target.value)} /></div>
        </div>}

        {step === 3 && <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className={labelClass} htmlFor="address">Address <span className="text-red-700" aria-hidden="true">*</span></label><textarea className={`${inputClass} min-h-28 resize-y`} id="address" name="address" rows={3} autoComplete="street-address" value={data.address} onChange={(e) => update("address", e.target.value)} aria-required="true" aria-invalid={!!errors.address} aria-describedby={errors.address ? "address-error" : undefined} /><FieldError id="address-error" message={errors.address} /></div>
          <div><label className={labelClass} htmlFor="area">Area / Town <span className="text-red-700" aria-hidden="true">*</span></label><input className={inputClass} id="area" name="area" autoComplete="address-level2" value={data.area} onChange={(e) => update("area", e.target.value)} aria-required="true" aria-invalid={!!errors.area} aria-describedby={errors.area ? "area-error" : undefined} /><FieldError id="area-error" message={errors.area} /></div>
          <LocationPicker value={coordinates} onChange={setCoordinates} />
          {data.placeType === "Hospital" && <div className="sm:col-span-2"><label className={labelClass} htmlFor="hospitalName">Hospital Name <span className="font-normal text-muted">(optional)</span></label><input className={inputClass} id="hospitalName" name="hospitalName" value={data.hospitalName} onChange={(e) => update("hospitalName", e.target.value)} /></div>}
        </div>}

        {step === 4 && <>
          <Review data={data} coordinates={coordinates} />
          <input type="hidden" name="requesterName" value={data.fullName} />
          <input type="hidden" name="mobileNumber" value={data.mobile} />
          <input type="hidden" name="alternativeNumber" value={data.alternative} />
          <input type="hidden" name="relationshipToDeceased" value={data.relationship} />
          <input type="hidden" name="serviceType" value={data.serviceType} />
          <input type="hidden" name="requiredDate" value={data.requiredDate} />
          <input type="hidden" name="requiredTime" value={data.requiredTime} />
          <input type="hidden" name="placeType" value={data.placeType} />
          <input type="hidden" name="address" value={data.address} />
          <input type="hidden" name="area" value={data.area} />
          <input type="hidden" name="latitude" value={coordinates?.latitude ?? ""} />
          <input type="hidden" name="longitude" value={coordinates?.longitude ?? ""} />
          <input type="hidden" name="hospitalName" value={data.hospitalName} />
          <input type="hidden" name="note" value={data.note} />
          {submission.error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submission.error}</p>}
        </>}

        <div className={`mt-9 flex gap-3 ${step === 1 ? "justify-end" : "justify-between"}`}>
          {step > 1 && <button type="button" onClick={previousStep} className="min-h-12 rounded-full border border-border bg-white px-5 py-3 font-semibold text-foreground transition hover:border-primary hover:bg-light-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none">{step === 4 ? "Back / Edit" : "Back"}</button>}
          <button type="submit" disabled={isPending} className="min-h-12 rounded-full bg-primary px-6 py-3 font-semibold text-foreground shadow-[0_8px_24px_rgba(69,232,205,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(69,232,205,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none">{isPending ? "Submitting..." : step === 4 ? "Submit Request" : "Continue"}</button>
        </div>
      </form>
    </div>
  );
}

function Review({ data, coordinates }: { data: RequestFormData; coordinates: { latitude: number; longitude: number } | null }) {
  const serviceLabel = serviceOptions.find((item) => item.value === data.serviceType)?.label ?? data.serviceType;
  const items = [
    ["Name", data.fullName], ["Phone", data.mobile], ["Service Type", serviceLabel],
    ["Date", data.requiredDate], ["Time", data.requiredTime || "Not specified"], ["Place Type", data.placeType],
    ["Address", data.address], ["Area", data.area],
    ...(coordinates ? [["Map Location", `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`]] : []),
    ...(data.placeType === "Hospital" ? [["Hospital", data.hospitalName || "Not specified"]] : []),
    ["Note", data.note || "Not provided"],
  ];
  return <dl className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">{items.map(([label, value]) => <div key={label} className={`bg-white p-4 ${label === "Address" || label === "Note" ? "sm:col-span-2" : ""}`}><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 break-words text-sm font-medium leading-6 text-foreground">{value}</dd></div>)}</dl>;
}
