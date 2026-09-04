"use client";

import { useActionState, useState } from "react";
import type { EmployeeActionState } from "@/app/admin/(protected)/employees/actions";

type EmployeeStatusActionProps = {
  action: (
    state: EmployeeActionState,
    formData: FormData,
  ) => Promise<EmployeeActionState>;
  label: string;
  confirmation?: string;
  destructive?: boolean;
};

const initialState: EmployeeActionState = {};

export function EmployeeStatusAction({ action, label, confirmation, destructive = false }: EmployeeStatusActionProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [isConfirming, setIsConfirming] = useState(false);

  if (confirmation && !isConfirming) {
    return (
      <div>
        <button type="button" onClick={() => setIsConfirming(true)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${destructive ? "border-red-200 text-red-700 hover:bg-red-50 focus-visible:outline-red-500" : "border-border hover:border-primary hover:bg-light-background focus-visible:outline-primary"}`}>
          {label}
        </button>
        {state.error && <p role="alert" className="mt-2 text-xs text-red-700">{state.error}</p>}
        {state.success && <p role="status" className="mt-2 text-xs text-muted">{state.success}</p>}
      </div>
    );
  }

  return (
    <form action={formAction} className={confirmation ? "min-w-52 rounded-xl border border-border bg-light-background p-3" : ""}>
      {confirmation && <p className="mb-3 text-xs font-medium text-foreground">{confirmation}</p>}
      <div className="flex items-center gap-2">
        {confirmation && (
          <button type="button" onClick={() => setIsConfirming(false)} className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold">Cancel</button>
        )}
        <button type="submit" disabled={isPending} className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${destructive ? "bg-red-600 text-white hover:bg-red-700" : "bg-primary text-foreground hover:brightness-95"}`}>
          {isPending ? "Updating..." : label}
        </button>
      </div>
      {state.error && <p role="alert" className="mt-2 text-xs text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="mt-2 text-xs text-muted">{state.success}</p>}
    </form>
  );
}
