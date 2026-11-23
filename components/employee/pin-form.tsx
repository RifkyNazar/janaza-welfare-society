"use client";

import { useActionState } from "react";
import Link from "next/link";
import { employeeLogin, setupEmployeePin } from "@/app/actions/auth";
import { T } from "@/components/public-language";
import { REMEMBERED_EMPLOYEE_SESSION_DAYS } from "@/lib/employee-session-duration";

export function EmployeePinForm({ setup = false }: { setup?: boolean }) {
  const [state, action, pending] = useActionState(setup ? setupEmployeePin : employeeLogin, {});
  return <form action={action} className="space-y-5 rounded-2xl border border-border bg-white p-6 sm:p-8">
    <label className="block text-sm font-semibold"><T text="Phone Number" />
      <input key={state.values?.phone} name="phone" type="tel" autoComplete="tel" maxLength={32} defaultValue={state.values?.phone} required className="employee-form-input mt-2" />
    </label>
    {setup && <label className="block text-sm font-semibold"><T text="One-time setup token" />
      <input name="token" type="password" maxLength={43} autoComplete="off" required className="employee-form-input mt-2" />
    </label>}
    <label className="block text-sm font-semibold"><T text="Six-digit PIN" />
      <input name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete={setup ? "new-password" : "current-password"} required className="employee-form-input mt-2" />
    </label>
    {setup ? <label className="block text-sm font-semibold"><T text="Confirm PIN" />
      <input name="confirmPin" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="new-password" required className="employee-form-input mt-2" />
    </label> : <label className="flex min-h-11 items-center gap-3 text-sm">
      <input name="remember" type="checkbox" className="size-5 accent-primary" />
      <T text={`Remember this device for ${REMEMBERED_EMPLOYEE_SESSION_DAYS} days`} />
    </label>}
    {state.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><T text={state.error} /></p>}
    <button disabled={pending} className="min-h-12 w-full rounded-full bg-primary px-6 font-semibold disabled:opacity-60"><T text={pending ? "Please wait..." : setup ? "Save PIN" : "Login"} /></button>
    {!setup && <div className="flex flex-wrap gap-4 text-sm">
      <Link className="underline" href="/employee-access/pin-setup"><T text="Set up PIN" /></Link>
      <Link className="underline" href="/employee-access/pin-reset"><T text="Reset PIN" /></Link>
      <Link className="underline" href="/employee-access/register"><T text="Register" /></Link>
    </div>}
  </form>;
}
