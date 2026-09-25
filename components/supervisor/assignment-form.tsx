"use client";
import { useActionState } from "react";
import type { DispatchState } from "@/app/supervisor/actions";

export function AssignmentForm({ action, employees, label }: { action: (state: DispatchState, data: FormData) => Promise<DispatchState>; employees: Array<{ id: number; name: string; availability: string; active: number }>; label: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="rounded-2xl border border-border bg-white p-5"><label htmlFor="employeeId" className="text-sm font-semibold">Assign Employee</label><select id="employeeId" name="employeeId" required className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4"><option value="">Select an available employee</option>{employees.map((e) => <option key={e.id} value={e.id} disabled={e.availability !== "AVAILABLE"}>{e.name} — {e.availability === "AVAILABLE" ? "Available" : "Unavailable"} — {e.active} Active {e.active === 1 ? "Task" : "Tasks"}</option>)}</select><button disabled={pending} className="mt-4 min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold disabled:opacity-60">{pending ? "Saving..." : label}</button>{state.error && <p role="alert" className="mt-3 text-sm text-red-700">{state.error}</p>}{state.success && <p role="status" className="mt-3 text-sm text-emerald-800">{state.success}</p>}</form>;
}
