"use client";

import { useActionState, useState } from "react";
import { issueEmployeePinSetup } from "@/app/admin/(protected)/employees/actions";
import { T } from "@/components/public-language";

export function EmployeePinEnrollment({ userId, phone }: { userId: number; phone: string }) {
  const [state, action, pending] = useActionState(issueEmployeePinSetup.bind(null, userId), {});
  const [hiddenToken, setHiddenToken] = useState("");
  const token = state.token !== hiddenToken ? state.token : null;
  return <section className="mt-6 space-y-4 rounded-2xl border border-border bg-white p-6">
    <h2 className="text-lg font-semibold"><T text="Employee PIN setup or reset" /></h2>
    <p className="text-sm text-muted"><T text="Verify the employee in person or through an established JWS contact before sharing a token privately. Issuing a token revokes the employee’s current PIN and sessions." /></p>
    <form action={action} className="space-y-4">
      <label className="block text-sm font-semibold"><T text="Verified phone number" />
        <input name="phone" type="tel" defaultValue={phone} required maxLength={32} className="employee-form-input mt-2 block max-w-md" />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input name="identityVerified" type="checkbox" required className="size-5 shrink-0 accent-primary" />
        <T text="I verified this employee’s identity and their control of this phone number." />
      </label>
      <button disabled={pending} className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold disabled:opacity-60">
        <T text={pending ? "Please wait..." : "Issue one-time token"} />
      </button>
    </form>
    {state.error && <p role="alert" className="text-sm text-red-700"><T text={state.error} /></p>}
    {token && <div role="status" className="space-y-3 rounded-xl border border-border bg-light-background p-4">
      <p className="text-sm"><T text="Share privately with the verified employee. This token expires 15 minutes after issuance." /></p>
      <code className="block select-all break-all" dir="ltr">{token}</code>
      <button type="button" className="min-h-11 text-sm underline" onClick={() => setHiddenToken(token)}><T text="Hide setup token" /></button>
    </div>}
  </section>;
}
