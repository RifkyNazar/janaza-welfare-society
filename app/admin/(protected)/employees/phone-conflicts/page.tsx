import type { Metadata } from "next";
import Link from "next/link";
import { EmployeeStatusBadge } from "@/components/admin/employee-status-badge";
import { T } from "@/components/public-language";
import { findEmployeePhoneConflicts } from "@/lib/employee-phone-registration";
import { requireAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "Duplicate Employee Phone Numbers" };

export default async function EmployeePhoneConflictsPage() {
  await requireAdmin();
  const conflicts = await findEmployeePhoneConflicts();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href="/admin/employees" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold">
        <T text="Back to Employees" />
      </Link>
      <h1 className="text-3xl font-semibold"><T text="Duplicate Employee Phone Numbers" /></h1>
      <p className="text-sm text-muted"><T text="Verify who controls each number before changing access. Open the account to reject a duplicate pending registration or disable a duplicate approved account. Both actions preserve the account and its phone details." /></p>
      <p className="text-sm text-muted"><T text="If two approved accounts belong to different people, verify a different number with one employee and use PIN setup or reset on their account. This replaces that account’s sign-in number and revokes its PIN and sessions." /></p>
      {conflicts.length === 0 && <p className="rounded-2xl border border-border bg-white p-5"><T text="No duplicate phone numbers among pending and approved employees." /></p>}
      {conflicts.map(([phone, accounts]) => (
        <section key={phone} className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-semibold" dir="ltr">{phone}</h2>
          <ul className="mt-3 divide-y divide-border">
            {accounts.map(({ id, status, employeeProfile, employeePin }) => (
              <li key={id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
                <Link href={`/admin/employees/${id}`} className="min-h-11 content-center font-semibold underline">
                  {employeeProfile?.fullName ?? <T text="Employee account" />} · {employeeProfile?.employeeCode ?? id}
                </Link>
                <EmployeeStatusBadge status={status} />
                {employeeProfile && <span dir="ltr"><T text="Contact phone number" /> {employeeProfile.phone}</span>}
                {employeePin && <span dir="ltr"><T text="Sign-in phone" /> {employeePin.phone}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
