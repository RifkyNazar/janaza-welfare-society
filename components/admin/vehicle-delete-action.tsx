"use client";

import { useActionState, useState } from "react";
import type { VehicleActionState } from "@/app/admin/(protected)/vehicles/actions";

export function VehicleDeleteAction({ action }: { action: (state: VehicleActionState, formData: FormData) => Promise<VehicleActionState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [confirming, setConfirming] = useState(false);
  if (!confirming) return <div><button type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-xl border border-red-300 bg-white px-5 text-sm font-semibold text-red-700">Delete Vehicle</button>{state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}</div>;
  return <form action={formAction} className="rounded-xl border border-red-200 bg-red-50 p-4">
    <p className="text-sm font-semibold text-red-900">Delete this vehicle permanently? This action cannot be undone.</p>
    <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setConfirming(false)} className="min-h-11 rounded-xl border border-border bg-white px-4 text-sm font-semibold">Cancel</button><button disabled={pending} className="min-h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Deleting..." : "Delete Permanently"}</button></div>
    {state.error && <p role="alert" className="mt-3 text-sm text-red-700">{state.error}</p>}
  </form>;
}
