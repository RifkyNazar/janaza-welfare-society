"use client";

import { useFormSubmission } from "@/components/use-form-submission";
import { validateImageSelection } from "@/lib/image-upload-limits";
import { T, useTranslation } from "@/components/public-language";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import type { AdState } from "@/app/admin/(protected)/advertisements/actions";
const input = "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
type Initial = { title:string; description:string; startsAt:string; endsAt:string; hasImage:boolean; imageUrl?:string };
export function AdvertisementForm({ action, initial }: { action:(state:AdState,data:FormData)=>Promise<AdState>; initial:Initial }) {
  const { t } = useTranslation();
  const [state, formAction, pending] = useActionState(action, {});
  const submission = useFormSubmission(state, pending);
  const [selection, setSelection] = useState<{ response: AdState; url: string; name: string }>();
  const current = selection?.response === state ? selection : undefined;
  const preview = current?.url;
  const filename = current?.name;
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <form action={formAction} onSubmit={submission.onSubmit} onChange={submission.onChange} className="mt-7 space-y-6 rounded-2xl border border-border bg-white p-5 shadow-[0_8px_28px_rgba(16,42,42,.05)] sm:p-7">
    <div><label htmlFor="title" className="text-sm font-semibold"><T text="Heading" /></label><input disabled={pending} id="title" name="title" required maxLength={191} defaultValue={state.values?.title ?? initial.title} className={input}/></div>
    <fieldset className="rounded-2xl border-2 border-dashed border-primary/60 bg-light-background p-4 sm:p-5"><legend className="px-2 text-sm font-semibold"><T text="Choose Banner Image" /></legend><label htmlFor="image" className="mt-2 flex min-h-14 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 py-3 text-center text-sm font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-foreground"><span>{filename || (initial.hasImage ? "Choose Replacement Image" : "Choose JPEG, PNG, or WEBP")}</span><input disabled={pending} id="image" name="image" type="file" required={!initial.hasImage} accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { validateImageSelection(event.currentTarget, t("Image must be 5 MB or smaller.")); const file=event.target.files?.[0]; setSelection(file ? { response: state, url: URL.createObjectURL(file), name: file.name } : undefined); }}/></label><p className="mt-2 text-center text-xs text-muted"><T text="Maximum 5 MB. The selected file is never restored after a validation error." /></p>{(preview || initial.imageUrl) && <div className="mt-4 overflow-hidden rounded-xl border border-border bg-white"><Image unoptimized src={preview ?? initial.imageUrl!} alt={t("Selected banner preview")} width={1200} height={400} className="mx-auto h-auto max-h-80 w-auto max-w-full object-contain"/></div>}</fieldset>
    <div><label htmlFor="description" className="text-sm font-semibold"><T text="Optional Description" /></label><textarea disabled={pending} id="description" name="description" maxLength={500} rows={3} defaultValue={state.values?.description ?? initial.description} className={input}/></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="startsAt" className="text-sm font-semibold"><T text="Start Date" /></label><input disabled={pending} id="startsAt" name="startsAt" type="date" required defaultValue={state.values?.startsAt ?? initial.startsAt} className={input}/></div><div><label htmlFor="endsAt" className="text-sm font-semibold"><T text="End Date" /></label><input disabled={pending} id="endsAt" name="endsAt" type="date" required defaultValue={state.values?.endsAt ?? initial.endsAt} className={input}/></div></div>
    <div aria-live="polite">{submission.showFeedback && state.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><T text={state.error} /></p>}{submission.showFeedback && state.success && <p role="status" className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm font-semibold">✓ <T text={state.success} /></p>}</div>
    <div className="flex flex-col-reverse gap-3 sm:flex-row"><Link href="/admin/advertisements" className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold"><T text="Cancel / Back" /></Link><button disabled={pending} className="min-h-12 rounded-full bg-primary px-7 font-semibold disabled:opacity-60"><T text={pending ? "Saving..." : "Save Advertisement"} /></button></div>
  </form>;
}
