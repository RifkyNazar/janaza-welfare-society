"use client";

import { useActionState } from "react";
import type { OperationActionState } from "@/app/admin/(protected)/operations/actions";
import { StatusMessage } from "@/components/status-message";

export function OperationPublishAction({ action, published }: { action: (state: OperationActionState, formData: FormData) => Promise<OperationActionState>; published: boolean }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction}><button disabled={pending} className={`rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60 ${published ? "border border-border bg-white" : "bg-primary text-foreground"}`}>{pending ? "Saving..." : published ? "Unpublish" : "Publish"}</button>{state.error && <p role="alert" className="mt-2 max-w-md text-sm text-red-700">{state.error}</p>}{state.success && <StatusMessage className="mt-2">{state.success}</StatusMessage>}</form>;
}
