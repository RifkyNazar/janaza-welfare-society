import type { Metadata } from "next";
import Link from "next/link";
import { redirectAuthenticatedUser } from "@/lib/permissions";

export const metadata: Metadata = { title: "Registration Submitted" };

export default async function EmployeeRegistrationSuccessPage() {
  await redirectAuthenticatedUser();
  return <main className="employee-auth-surface relative overflow-hidden px-5 py-16 sm:px-8 sm:py-24">
    <div className="employee-auth-pattern" aria-hidden="true" />
    <section aria-labelledby="registration-submitted" className="relative mx-auto max-w-2xl rounded-3xl border border-border bg-white p-6 text-center shadow-[0_18px_55px_rgba(16,42,42,0.1)] sm:p-10">
      <h1 id="registration-submitted" className="text-3xl font-semibold tracking-tight">Registration submitted</h1>
      <p role="status" aria-live="polite" className="mt-5 text-base leading-7 text-muted">Your account requires administrator approval before login.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 font-semibold">Back to Home</Link>
        <Link href="/employee-access/register" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 font-semibold">Submit Another Registration</Link>
      </div>
    </section>
  </main>;
}
