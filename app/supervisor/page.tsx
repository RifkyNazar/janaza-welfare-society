import Link from "next/link";
import { PushNotificationControl } from "@/components/push-notification-control";
import { prisma } from "@/lib/prisma";
import { requireAdminOrSupervisor } from "@/lib/permissions";

export default async function SupervisorDashboard() {
  await requireAdminOrSupervisor();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [needs, assigned, progress, completed] = await Promise.all([
    prisma.serviceRequest.count({ where: { status: "NEW", taskAssignments: { none: { isActive: true } } } }),
    prisma.taskAssignment.count({ where: { isActive: true, status: { in: ["ASSIGNED", "ACKNOWLEDGED"] } } }),
    prisma.taskAssignment.count({ where: { isActive: true, status: "IN_PROGRESS" } }),
    prisma.taskAssignment.count({ where: { status: "COMPLETED", completedAt: { gte: start } } }),
  ]);
  return <div className="mx-auto max-w-7xl">
    <p className="text-sm font-semibold text-primary">Live operations</p><h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Supervisor Dashboard</h1>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Needs Assignment", needs, "/supervisor/requests"], ["Assigned", assigned, "/supervisor/tasks?status=assigned"], ["In Progress", progress, "/supervisor/tasks?status=in-progress"], ["Completed Today", completed, "/supervisor/tasks?status=completed"]].map(([label, count, href]) => <Link key={label} href={String(href)} className="rounded-2xl border border-border bg-white p-5"><p className="text-sm text-muted">{label}</p><p className="mt-3 text-3xl font-semibold tabular-nums">{count}</p></Link>)}</section>
    <PushNotificationControl vapidPublicKey={process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ?? ""} />
    <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["New / Unassigned Requests", "/supervisor/requests"], ["Employees / Availability", "/supervisor/employees"], ["Vehicles", "/supervisor/vehicles"]].map(([label, href]) => <Link key={href} href={href} className="min-h-20 rounded-2xl border border-border bg-white p-5 font-semibold hover:border-primary">{label}</Link>)}</section>
  </div>;
}
