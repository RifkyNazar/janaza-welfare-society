import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { PushNotificationControl } from "@/components/push-notification-control";

export const metadata: Metadata = { title: "Admin Dashboard" };

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function StatusBadge({ status }: { status: string }) {
  return <span className="inline-flex rounded-full bg-primary/12 px-2.5 py-1 text-xs font-semibold text-foreground">{status.replaceAll("_", " ")}</span>;
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [pendingEmployees, approvedEmployees, newRequests, activeTasks, recentEmployees, recentRequests] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYEE", status: "PENDING" } }),
    prisma.user.count({ where: { role: "EMPLOYEE", status: "APPROVED" } }),
    prisma.serviceRequest.count({ where: { status: "NEW" } }),
    prisma.taskAssignment.count({ where: { isActive: true, status: { in: ["ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS"] } } }),
    prisma.employeeProfile.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        fullName: true,
        employeeCode: true,
        createdAt: true,
        user: { select: { status: true } },
      },
    }),
    prisma.serviceRequest.findMany({
      take: 5,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        requestCode: true,
        requesterName: true,
        area: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const summaries = [
    { label: "Pending Employees", value: pendingEmployees },
    { label: "Approved Employees", value: approvedEmployees },
    { label: "New Service Requests", value: newRequests, href: "/admin/service-requests?status=NEW" },
    { label: "Active Tasks", value: activeTasks },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <p className="text-sm font-semibold text-primary">Overview</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-sm text-muted">Current operational summary from the welfare database.</p>
      </div>

      <section aria-label="Dashboard summary" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaries.map((summary) => (
          <article key={summary.label} className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_rgba(16,42,42,0.05)]">
            <span aria-hidden="true" className="absolute right-0 top-0 size-16 translate-x-5 -translate-y-5 rotate-45 border border-primary/25" />
            <p className="text-sm font-medium text-muted">{summary.label}</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{summary.value}</p>
            {"href" in summary && summary.href && <Link href={summary.href} className="absolute inset-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><span className="sr-only">View new service requests</span></Link>}
          </article>
        ))}
      </section>

      <PushNotificationControl vapidPublicKey={process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ?? ""} />

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_30px_rgba(16,42,42,0.04)]">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Recent Employee Registrations</h2>
          </div>
          <div className="divide-y divide-border">
            {recentEmployees.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">No employee registrations yet.</p>
            ) : recentEmployees.map((employee) => (
              <div key={employee.employeeCode} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{employee.fullName}</p>
                  <p className="mt-1 text-xs text-muted">{employee.employeeCode} · {dateFormatter.format(employee.createdAt)}</p>
                </div>
                <StatusBadge status={employee.user.status} />
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_30px_rgba(16,42,42,0.04)]">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Recent Service Requests</h2>
          </div>
          <div className="divide-y divide-border">
            {recentRequests.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">No service requests yet.</p>
            ) : recentRequests.map((request) => (
              <div key={request.requestCode} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{request.requesterName}</p>
                  <p className="mt-1 text-xs text-muted">{request.requestCode} · {request.area} · {dateFormatter.format(request.createdAt)}</p>
                </div>
                <StatusBadge status={request.status} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
