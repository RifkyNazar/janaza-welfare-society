"use client";

import { useActionState } from "react";
import type { DonationReviewState } from "@/app/admin/(protected)/donations/actions";

export function DonationReviewAction({ action, label, reject = false }: { action: (state: DonationReviewState, formData: FormData) => Promise<DonationReviewState>; label: string; reject?: boolean }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="rounded-2xl border border-border bg-light-background p-5"><label className="text-sm font-semibold">Review Note <span className="font-normal text-muted">(optional)</span><textarea name="reviewNote" maxLength={191} rows={3} className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-normal outline-none focus:border-primary" /></label><button disabled={pending} className={`mt-4 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60 ${reject ? "border border-red-200 bg-white text-red-800" : "bg-primary text-foreground"}`}>{pending ? "Saving..." : label}</button>{state.error && <p className="mt-3 text-sm text-red-700" role="alert">{state.error}</p>}{state.success && <p className="mt-3 text-sm font-semibold" role="status">{state.success}</p>}</form>;
}
