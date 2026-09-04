import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";

export const metadata: Metadata = { title: "Employee Profile" };

export default async function EmployeeProfilePage() {
  const session = await requireEmployee();
  const userId = Number(session.user.id);
  const employee = await prisma.user.findFirst({ where: { id: userId, role: "EMPLOYEE" }, select: { email: true, status: true, employeeProfile: { select: { fullName: true, employeeCode: true, phone: true, position: true, duty: true } } } });
  if (!employee?.employeeProfile) notFound();
  const profile = employee.employeeProfile;
  const items = [["Full Name", profile.fullName], ["Employee Code", profile.employeeCode], ["Email", employee.email], ["Phone", profile.phone], ["Position", profile.position], ["Duty", profile.duty || "—"], ["Account Status", employee.status]];

  return <div className="mx-auto max-w-3xl"><p className="text-sm font-semibold text-primary">Account</p><h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Employee Profile</h1><p className="mt-2 text-sm text-muted">Your current employee account information.</p><section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)] sm:p-8"><dl className="divide-y divide-border">{items.map(([label, value]) => <div key={label} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt><dd className="break-words text-sm font-medium">{value}</dd></div>)}</dl><p className="mt-6 text-xs text-muted">Profile editing is not available yet.</p></section></div>;
}
