"use client";

import { useFormSubmission } from "@/components/use-form-submission";
import { validateImageSelection } from "@/lib/image-upload-limits";

import { useActionState } from "react";
import { T, useTranslation } from "@/components/public-language";
import type { OperationActionState } from "@/lib/operation-fields";

export function OperationForm({ action, initial, replacePhoto = false }: {
  action: (state: OperationActionState, form: FormData) => Promise<OperationActionState>;
  replacePhoto?: boolean;
  initial?: { title: string; description: string };
}) {
  const [state, submit, pending] = useActionState(action, {});
  const submission = useFormSubmission(state, pending);
  const { t } = useTranslation();
  const field = "mt-2 block w-full rounded-xl border border-border p-3";
  return <form action={submit} onSubmit={submission.onSubmit} onChange={submission.onChange} className="mt-6 space-y-5 rounded-2xl border border-border bg-white p-5">
    {(!initial || replacePhoto) && <label className="block font-semibold"><T text={initial ? "Replace Photo (optional)" : "Photo"} />
      <input disabled={pending} name="photo" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={event => validateImageSelection(event.currentTarget, t("Image must be 5 MB or smaller."))} required={!initial} className={field} />
      <span className="mt-1 block text-sm text-muted"><T text="JPEG, PNG or WebP, up to 5 MB." /></span>
    </label>}
    <label className="block font-semibold"><T text="Heading" />
      <input disabled={pending} name="title" required maxLength={191} defaultValue={state.values?.title ?? initial?.title} className={field} />
    </label>
    <label className="block font-semibold"><T text="Optional Description" />
      <textarea disabled={pending} name="description" maxLength={10000} rows={4} defaultValue={state.values?.description ?? initial?.description} className={field} />
    </label>
    {submission.showFeedback && state.error && <p role="alert" className="text-red-700"><T text={state.error} /></p>}
    {submission.showFeedback && state.success && <p role="status"><T text={state.success} /></p>}
    <button disabled={pending} className="min-h-11 rounded-xl bg-primary px-5 font-semibold"><T text={pending ? "Saving..." : initial ? "Save Changes" : "Add Operation"} /></button>
  </form>;
}
