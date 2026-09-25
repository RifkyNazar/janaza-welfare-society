"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthActionState } from "@/app/actions/auth";
import { PasswordField } from "@/components/employee/password-field";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-[0_14px_40px_rgba(16,42,42,0.08)] sm:p-8">
      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="employee-identifier" className="block text-sm font-semibold text-foreground">Email or Employee ID</label>
          <input key={state.values?.identifier} id="employee-identifier" name="identifier" type="text" autoComplete="username" required defaultValue={state.values?.identifier} className="employee-form-input mt-2" />
        </div>

        <PasswordField id="login-password" name="password" label="Password" autoComplete="current-password" />

        {state.error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>
        )}

        <button type="submit" disabled={isPending} className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-foreground transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(69,232,205,0.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none">
          {isPending ? "Signing in..." : "Login"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/employee-access/register" className="font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Register</Link>
      </p>
    </div>
  );
}
