"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerEmployee, type AuthActionState } from "@/app/actions/auth";
import { PasswordField } from "@/components/employee/password-field";

const fields = [
  { id: "full-name", name: "fullName", label: "Full Name", type: "text", autoComplete: "name" },
  { id: "employee-code", name: "employeeCode", label: "Employee / Staff ID", type: "text", autoComplete: "off" },
  { id: "position", name: "position", label: "Position / Role", type: "text", autoComplete: "organization-title" },
  { id: "phone", name: "phone", label: "Phone Number", type: "tel", autoComplete: "tel" },
  { id: "email", name: "email", label: "Email Address", type: "email", autoComplete: "email" },
] as const;

const initialState: AuthActionState = {};

export function RegistrationForm() {
  const [state, formAction, isPending] = useActionState(registerEmployee, initialState);

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-white p-6 shadow-[0_14px_40px_rgba(16,42,42,0.08)] sm:p-8">
      <form action={formAction}>
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.id} className={field.id === "email" ? "sm:col-span-2" : ""}>
              <label htmlFor={field.id} className="block text-sm font-semibold text-foreground">{field.label}</label>
              <input id={field.id} name={field.name} type={field.type} autoComplete={field.autoComplete} required className="employee-form-input mt-2" />
            </div>
          ))}
          <PasswordField id="registration-password" name="password" label="Password" autoComplete="new-password" />
          <PasswordField id="confirm-password" name="confirmPassword" label="Confirm Password" autoComplete="new-password" />
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm leading-6 text-muted">
          <input type="checkbox" name="confirmation" required className="mt-1 size-4 shrink-0 rounded border-border accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
          I confirm that the information provided is correct.
        </label>

        {state.error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>
        )}
        {state.success && (
          <p role="status" className="mt-5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground">{state.success}</p>
        )}

        <button type="submit" disabled={isPending || Boolean(state.success)} className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-semibold text-foreground transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(69,232,205,0.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none">
          {isPending ? "Submitting..." : "Submit Registration"}
        </button>
        <p className="mt-4 text-center text-xs leading-5 text-muted">
          Submitting this form does not provide immediate access. Your account must be approved by an administrator.
        </p>
      </form>

      <p className="mt-6 border-t border-border pt-6 text-center text-sm text-muted">
        Already registered?{" "}
        <Link href="/employee-access/login" className="font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Login</Link>
      </p>
    </div>
  );
}
