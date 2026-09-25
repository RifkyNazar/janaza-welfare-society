"use client";

import { useActionState, useState } from "react";
import type { EmployeeActionState } from "@/app/admin/(protected)/employees/actions";
import { StatusMessage } from "@/components/status-message";

export function SupervisorRoleAction({ action, grant }: { action: (state: EmployeeActionState, formData: FormData) => Promise<EmployeeActionState>; grant: boolean }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [confirming, setConfirming] = useState(false);
  const label = grant ? "Promote to Supervisor" : "Remove Supervisor Access";
  const question = grant ? "Give Supervisor access to this employee?" : "Remove Supervisor access from this user?";
  return <div>
    {state.success && <StatusMessage className="mb-3">{state.success}</StatusMessage>}
    {!confirming ? <button type="button" onClick={() => setConfirming(true)} className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${grant ? "bg-primary" : "border border-red-200 text-red-700"}`}>{label}</button> : <form action={formAction} className="rounded-xl border border-border bg-light-background p-4">
      <p className="text-sm font-semibold">{question}</p>
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setConfirming(false)} className="min-h-11 rounded-xl border border-border bg-white px-4 text-sm font-semibold">Cancel</button><button disabled={pending} className={`min-h-11 rounded-xl px-4 text-sm font-semibold disabled:opacity-60 ${grant ? "bg-primary" : "bg-red-600 text-white"}`}>{pending ? "Updating..." : "Confirm"}</button></div>
    </form>}
    {state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}
  </div>;
}
