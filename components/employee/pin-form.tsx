"use client";

import { useFormSubmission } from "@/components/use-form-submission";

import { useActionState } from "react";
import { employeeLogin } from "@/app/actions/auth";
import { T } from "@/components/public-language";
import { REMEMBERED_EMPLOYEE_SESSION_DAYS } from "@/lib/employee-session-duration";

export function EmployeePinForm() {
  const [state, action, pending] = useActionState(employeeLogin, {});
  const submission = useFormSubmission(state, pending);
  return <form action={action} onSubmit={submission.onSubmit} onChange={submission.onChange} className="space-y-5 rounded-2xl border border-border bg-white p-6 sm:p-8">
    <label className="block text-sm font-semibold"><T text="Phone Number" />
      <input disabled={pending} key={state.values?.phone} name="phone" type="tel" autoComplete="tel" maxLength={32} defaultValue={state.values?.phone} required className="employee-form-input mt-2" />
    </label>
    <label className="block text-sm font-semibold"><T text="6-digit login code" />
      <input disabled={pending} name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="current-password" required className="employee-form-input mt-2" />
    </label>
    <label className="flex min-h-11 items-center gap-3 text-sm">
      <input disabled={pending} name="remember" type="checkbox" className="size-5 accent-primary" />
      <T text={`Remember this device for ${REMEMBERED_EMPLOYEE_SESSION_DAYS} days`} />
    </label>
    {submission.showFeedback && state.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><T text={state.error} /></p>}
    <button disabled={pending} className="min-h-12 w-full rounded-full bg-primary px-6 font-semibold disabled:opacity-60"><T text={pending ? "Please wait..." : "Login"} /></button>
  </form>;
}
