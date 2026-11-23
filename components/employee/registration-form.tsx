"use client";
import { T } from "@/components/public-language";

import { useActionState } from "react";
import Link from "next/link";
import { registerEmployee, type AuthActionState } from "@/app/actions/auth";

const fields = [
  { id: "full-name", name: "fullName", label: "Full Name", type: "text", autoComplete: "name" },
  { id: "phone", name: "phone", label: "Phone Number", type: "tel", autoComplete: "tel" },
  { id: "position", name: "position", label: "Position", type: "text", autoComplete: "organization-title" },
] as const;

const initialState: AuthActionState = {};

export function RegistrationForm() {
  const [state, formAction, isPending] = useActionState(registerEmployee, initialState);

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-white p-6 shadow-[0_14px_40px_rgba(16,42,42,0.08)] sm:p-8">
      <form action={formAction}>
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.id} className={field.id === "position" ? "sm:col-span-2" : ""}>
              <label htmlFor={field.id} className="block text-sm font-semibold text-foreground"><T text={field.label} /></label>
              <input key={`${field.name}-${state.values?.[field.name] ?? ""}`} id={field.id} name={field.name} type={field.type} autoComplete={field.autoComplete} maxLength={field.type === "tel" ? 32 : 150} required defaultValue={state.values?.[field.name] as string | undefined} className="employee-form-input mt-2" />
            </div>
          ))}
        </div>


        {state.error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><T text={state.error} /></p>
        )}
        <button type="submit" disabled={isPending} className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-semibold text-foreground transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(8,127,35,0.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none">
          <T text={isPending ? "Submitting..." : "Submit Registration"} />
        </button>
        <p className="mt-4 text-center text-xs leading-5 text-muted">
          <T text="Submitting this form does not provide immediate access. Your account must be approved by an administrator." />
        </p>
      </form>

      <p className="mt-6 border-t border-border pt-6 text-center text-sm text-muted">
        <T text="Already registered?" />{" "}
        <Link href="/employee-access/login" className="font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"><T text="Login" /></Link>
      </p>
    </div>
  );
}
