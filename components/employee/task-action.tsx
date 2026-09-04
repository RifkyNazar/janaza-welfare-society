"use client";

import { useActionState, useState } from "react";
import type { TaskActionState } from "@/app/employee/(protected)/actions";

type TaskActionProps = {
  action: (state: TaskActionState, formData: FormData) => Promise<TaskActionState>;
  label: string;
  confirmation?: string;
};

export function TaskAction({ action, label, confirmation }: TaskActionProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [isConfirming, setIsConfirming] = useState(false);

  if (confirmation && !isConfirming) {
    return (
      <div>
        <button type="button" onClick={() => setIsConfirming(true)} className="min-h-11 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-foreground transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">{label}</button>
        {state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}
      </div>
    );
  }

  return (
    <form action={formAction} className={confirmation ? "rounded-xl border border-border bg-light-background p-4" : ""}>
      {confirmation && <p className="mb-3 text-sm font-medium">{confirmation}</p>}
      <div className="flex gap-2">
        {confirmation && <button type="button" onClick={() => setIsConfirming(false)} className="min-h-11 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold">Cancel</button>}
        <button type="submit" disabled={isPending} className="min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60">{isPending ? "Updating..." : label}</button>
      </div>
      {state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
