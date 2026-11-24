"use client";

import { useFormSubmission } from "@/components/use-form-submission";

import { useActionState } from "react";
import { T } from "@/components/public-language";
import type { EmployeeActionState } from "@/app/admin/(protected)/employees/actions";

export function AdminEmployeeForm({ action, initial }: {
  action: (state: EmployeeActionState, form: FormData) => Promise<EmployeeActionState>;
  initial?: { fullName: string; position: string; phone: string };
}) {
  const [state, submit, pending] = useActionState(action, {});
  const submission = useFormSubmission(state, pending);
  const field = "mt-2 block w-full rounded-xl border border-border p-3";
  return <form action={submit} onSubmit={submission.onSubmit} onChange={submission.onChange} className="mt-6 space-y-4 rounded-2xl border border-border bg-white p-5">
    {initial && <h2 className="text-lg font-semibold"><T text="Edit Employee" /></h2>}
    <label className="block font-semibold"><T text="Full Name" /><input disabled={pending} name="fullName" maxLength={150} defaultValue={state.values?.fullName ?? initial?.fullName} required className={field} /></label>
    <label className="block font-semibold"><T text="Phone Number" /><input disabled={pending} name="phone" type="tel" maxLength={32} defaultValue={state.values?.phone ?? initial?.phone} required className={field} /></label>
    <label className="block font-semibold"><T text="Position" /><input disabled={pending} name="position" maxLength={150} defaultValue={state.values?.position ?? initial?.position} required className={field} /></label>
    <label className="block font-semibold"><T text={initial ? "New six-digit login code" : "Six-digit login code"} />
      <input disabled={pending} name="code" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="new-password" required={!initial} className={field} />
      {initial && <span className="mt-1 block text-sm text-muted"><T text="Enter a new code to reset login access and sign out existing sessions." /></span>}
    </label>
    {submission.showFeedback && state.error && <p role="alert" className="text-red-700"><T text={state.error} /></p>}
    {submission.showFeedback && state.success && <p role="status"><T text={state.success} /></p>}
    <button disabled={pending} className="min-h-11 rounded-xl bg-primary px-5 font-semibold"><T text={pending ? "Saving..." : initial ? "Save Employee" : "Add Employee"} /></button>
  </form>;
}
