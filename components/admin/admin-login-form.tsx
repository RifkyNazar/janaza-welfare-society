"use client";

import { useActionState } from "react";
import { adminLogin, type AuthActionState } from "@/app/actions/auth";
import { PasswordField } from "@/components/employee/password-field";

const initialState: AuthActionState = {};

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(adminLogin, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="admin-email" className="block text-sm font-semibold text-foreground">Email</label>
        <input key={state.values?.email} id="admin-email" name="email" type="email" autoComplete="username" required defaultValue={state.values?.email} className="employee-form-input mt-2" />
      </div>

      <PasswordField id="admin-password" name="password" label="Password" autoComplete="current-password" />

      {state.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>
      )}

      <button type="submit" disabled={isPending} className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-foreground shadow-[0_10px_28px_rgba(69,232,205,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(69,232,205,0.34)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none">
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
