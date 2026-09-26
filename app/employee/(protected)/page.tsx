import type { Metadata } from "next";
import Link from "next/link";
import { PushNotificationControl } from "@/components/push-notification-control";
import { updateAvailability } from "./actions";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";

export const metadata: Metadata = { title: "Employee Dashboard" };

export default async function EmployeeDashboardPage() {
  const session = await requireEmployee();
  const profileId = session.user.employeeProfileId;
  const [profile, assigned, inProgress, completed] = await Promise.all([
    profileId ? prisma.employeeProfile.findUnique({ where: { id: profileId }, select: { availability: true } }) : null,
    profileId ? prisma.taskAssignment.count({ where: { employeeId: profileId, isActive: true, status: { in: ["ASSIGNED", "ACKNOWLEDGED"] } } }) : 0,
    profileId ? prisma.taskAssignment.count({ where: { employeeId: profileId, isActive: true, status: "IN_PROGRESS" } }) : 0,
    profileId ? prisma.taskAssignment.count({ where: { employeeId: profileId, status: "COMPLETED" } }) : 0,
  ]);
  return <div className="mx-auto max-w-7xl">
    <p className="text-sm font-semibold text-primary">My Work</p><h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Employee Dashboard</h1>
    <p className="mt-2 text-sm text-muted">Your assigned work and operational availability.</p>
    <section className="mt-7 grid gap-4 sm:grid-cols-3">{[["Awaiting / Acknowledged", assigned], ["In Progress", inProgress], ["Completed", completed]].map(([label, count]) => <Link key={label} href={label === "Completed" ? "/employee/completed" : "/employee/my-tasks"} className="rounded-2xl border border-border bg-white p-5"><p className="text-sm text-muted">{label}</p><p className="mt-3 text-3xl font-semibold tabular-nums">{count}</p></Link>)}</section>
    <PushNotificationControl vapidPublicKey={process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ?? ""} />
    <section id="availability" className="mt-7 rounded-2xl border border-border bg-white p-5 sm:p-6"><h2 className="text-lg font-semibold">Availability</h2><p className="mt-2 text-sm text-muted">Set whether dispatch can assign new work to you.</p><p className="mt-4 font-semibold">Currently: {profile?.availability.replaceAll("_", " ") ?? "Unavailable"}</p><div className="mt-4 flex flex-wrap gap-3"><form action={updateAvailability}><input type="hidden" name="availability" value="AVAILABLE"/><button className="min-h-11 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold">Mark Available</button></form><form action={updateAvailability}><input type="hidden" name="availability" value="UNAVAILABLE"/><button className="min-h-11 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold">Mark Unavailable</button></form></div></section>
  </div>;
}
