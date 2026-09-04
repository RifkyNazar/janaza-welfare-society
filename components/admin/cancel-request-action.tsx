"use client";

import { useActionState, useState } from "react";
import type { RequestActionState } from "@/app/admin/(protected)/service-requests/actions";

type CancelRequestActionProps = {
  action: (state: RequestActionState, formData: FormData) => Promise<RequestActionState>;
};

export function CancelRequestAction({ action }: CancelRequestActionProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <div>
        <button type="button" onClick={() => setIsConfirming(true)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500">Cancel Request</button>
        {state.error && <p role="alert" className="mt-2 text-xs text-red-700">{state.error}</p>}
        {state.success && <p role="status" className="mt-2 text-xs text-muted">{state.success}</p>}
      </div>
    );
  }

  return (
    <form action={formAction} className="min-w-56 rounded-xl border border-red-200 bg-red-50 p-3">
      <p className="mb-3 text-xs font-medium text-red-900">Cancel this service request?</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setIsConfirming(false)} className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold">Keep Request</button>
        <button type="submit" disabled={isPending} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">{isPending ? "Cancelling..." : "Cancel Request"}</button>
      </div>
      {state.error && <p role="alert" className="mt-2 text-xs text-red-700">{state.error}</p>}
    </form>
  );
}
