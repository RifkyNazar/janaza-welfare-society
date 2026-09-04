"use client";

import { useActionState } from "react";
import type { PhotoReviewState } from "@/app/admin/(protected)/task-assignments/photo-actions";

export function PhotoReviewAction({ action, approved }: { action: (state: PhotoReviewState, formData: FormData) => Promise<PhotoReviewState>; approved: boolean }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="mt-4"><button disabled={pending} className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${approved ? "border border-border bg-white hover:border-primary" : "bg-primary text-foreground"}`}>{pending ? "Saving..." : approved ? "Remove Public Approval" : "Approve for Public Use"}</button>{state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}{state.success && <p role="status" className="mt-2 text-sm text-emerald-800">{state.success}</p>}</form>;
}
