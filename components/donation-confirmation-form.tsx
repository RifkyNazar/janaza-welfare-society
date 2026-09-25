"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitDonationConfirmation, type DonationActionState } from "@/app/actions/donation";
import { CopyTextButton } from "@/components/copy-text-button";
import { DownloadDonationPdf } from "@/components/download-donation-pdf";

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20";
const labelClass = "text-sm font-semibold text-foreground";

export function DonationConfirmationForm() {
  const [state, action, pending] = useActionState<DonationActionState, FormData>(submitDonationConfirmation, {});
  if (state.referenceCode) return <div className="rounded-3xl border border-primary/40 bg-white p-7 text-center shadow-[0_20px_60px_rgba(16,42,42,0.08)] sm:p-10" role="status">
    <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/20 text-3xl" aria-hidden="true">✓</span><h2 className="mt-5 text-2xl font-semibold">Thank you for supporting JWS.</h2><p className="mt-3 text-sm text-muted">JWS will review the transfer details and proof submitted.</p>
    <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-primary/50 bg-light-background p-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Reference</p><p className="mt-2 break-all text-xl font-semibold">{state.referenceCode}</p><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Status</p><p className="mt-1 font-semibold">Pending Verification</p></div>
    <p className="mt-5 text-sm text-muted">Please keep your donation reference code safely. Your uploaded receipt remains private.</p><div className="mt-7 grid gap-3 sm:grid-cols-3"><CopyTextButton value={state.referenceCode} label="Copy Reference" /><DownloadDonationPdf referenceCode={state.referenceCode} pdfBase64={state.pdfBase64} /><Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold">Return Home</Link></div>
  </div>;
  return <form action={action} className="rounded-3xl border border-border bg-white p-6 shadow-[0_20px_60px_rgba(16,42,42,0.07)] sm:p-8">
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="sm:col-span-2"><label htmlFor="donor-name" className={labelClass}>Full Name <span className="text-red-700">*</span></label><input key={`n-${state.values?.fullName}`} id="donor-name" name="fullName" required maxLength={150} autoComplete="name" defaultValue={state.values?.fullName} className={inputClass} /></div>
      <div><label htmlFor="donor-mobile" className={labelClass}>Mobile Number <span className="text-red-700">*</span></label><input key={`m-${state.values?.mobileNumber}`} id="donor-mobile" name="mobileNumber" type="tel" inputMode="tel" required maxLength={30} autoComplete="tel" defaultValue={state.values?.mobileNumber} className={inputClass} /></div>
      <div><label htmlFor="donation-amount" className={labelClass}>Donation Amount (LKR) <span className="text-red-700">*</span></label><input key={`a-${state.values?.amount}`} id="donation-amount" name="amount" type="number" required min="0.01" max="9999999999.99" step="0.01" inputMode="decimal" defaultValue={state.values?.amount} className={inputClass} /></div>
      <div><label htmlFor="transfer-date" className={labelClass}>Transfer Date <span className="text-red-700">*</span></label><input key={`d-${state.values?.transferDate}`} id="transfer-date" name="transferDate" type="date" required defaultValue={state.values?.transferDate} className={inputClass} /></div>
      <div><label htmlFor="bank-reference" className={labelClass}>Bank / Transfer Reference <span className="font-normal text-muted">(optional)</span></label><input key={`r-${state.values?.bankReference}`} id="bank-reference" name="bankReference" maxLength={150} autoComplete="off" defaultValue={state.values?.bankReference} className={inputClass} /></div>
      <div className="sm:col-span-2"><label htmlFor="donation-note" className={labelClass}>Message / Note <span className="font-normal text-muted">(optional)</span></label><textarea key={`t-${state.values?.note}`} id="donation-note" name="note" maxLength={2000} rows={4} defaultValue={state.values?.note} className={`${inputClass} resize-y`} /></div>
      <div className="sm:col-span-2"><label htmlFor="donation-receipt" className={labelClass}>Transfer Receipt / Proof <span className="text-red-700">*</span></label><input id="donation-receipt" name="receipt" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-primary/20 file:px-4 file:py-2 file:font-semibold`} /><p className="mt-2 text-xs text-muted">JPEG, PNG, WEBP, or PDF. Maximum 5 MB. Receipts are private and visible only to authorized JWS administrators.</p></div>
    </div>
    {state.error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
    <button disabled={pending} className="mt-7 min-h-12 rounded-full bg-primary px-7 py-3 font-semibold shadow-[0_8px_24px_rgba(69,232,205,0.25)] disabled:opacity-60">{pending ? "Submitting..." : "Submit Transfer Confirmation"}</button>
  </form>;
}
