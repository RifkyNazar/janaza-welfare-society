import type { Metadata } from "next";
import Link from "next/link";
import { EmployeeStatusBadge } from "@/components/admin/employee-status-badge";
import { RequestStatusBadge } from "@/components/admin/request-status-badge";
import { TaskStatusBadge } from "@/components/employee/task-status-badge";
import { PortalDate } from "@/components/portal-date";
import { PushNotificationControl } from "@/components/push-notification-control";
import { T } from "@/components/public-language";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "Admin Dashboard" };

const activeAssignment = {
  isActive: true,
  status: { in: ["ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS"] },
} satisfies Prisma.TaskAssignmentWhereInput;

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [pending, approved, newRequests, activeTasks, registrations, requests, assignments] = await Promise.all([
    prisma.user.count({ where: { role: "EMPLOYEE", status: "PENDING" } }),
    prisma.user.count({ where: { role: "EMPLOYEE", status: "APPROVED" } }),
    prisma.serviceRequest.count({ where: { status: "NEW" } }),
    prisma.taskAssignment.count({ where: activeAssignment }),
    prisma.employeeProfile.findMany({
      take: 5,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      where: { user: { role: { in: ["EMPLOYEE", "SUPERVISOR"] } } },
      select: { fullName: true, employeeCode: true, createdAt: true, user: { select: { id: true, status: true } } },
    }),
    prisma.serviceRequest.findMany({
      take: 5,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, requestCode: true, requesterName: true, area: true, status: true, createdAt: true },
    }),
    prisma.taskAssignment.findMany({
      take: 5,
      where: activeAssignment,
      orderBy: [{ assignedAt: "desc" }, { id: "desc" }],
      select: { id: true, status: true, assignedAt: true, employee: { select: { fullName: true } }, request: { select: { requestCode: true } } },
    }),
  ]);

  const summaries = [
    ["Legacy Inactive Accounts", pending, "/admin/employees?status=PENDING"],
    ["Approved Employees", approved, "/admin/employees?status=APPROVED"],
    ["New Service Requests", newRequests, "/admin/service-requests?status=NEW"],
    ["Active Tasks", activeTasks, "/admin/task-assignments"],
  ] as const;

  const queues = [
    { title: "Recent Employee Accounts", empty: "No employee accounts yet.", rows: registrations.map(({ user, fullName, employeeCode, createdAt }) => ({
      href: `/admin/employees/${user.id}`, name: fullName, details: employeeCode, date: createdAt, badge: <EmployeeStatusBadge status={user.status} />,
    })) },
    { title: "Recent Service Requests", empty: "No service requests yet.", rows: requests.map((request) => ({
      href: `/admin/service-requests/${request.id}`, name: request.requesterName, details: `${request.requestCode} · ${request.area}`, date: request.createdAt, badge: <RequestStatusBadge status={request.status} />,
    })) },
    { title: "Active Task Assignments", empty: "No active tasks", rows: assignments.map((assignment) => ({
      href: `/admin/task-assignments/${assignment.id}`, name: assignment.employee.fullName, details: assignment.request.requestCode, date: assignment.assignedAt, badge: <TaskStatusBadge status={assignment.status} />,
    })) },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="portal-overview-banner">
        <h1 className="font-semibold"><T text="Dashboard" /></h1>
        <p className="mt-1 text-sm"><T text="Review requests, employee accounts, and active assignments." /></p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaries.map(([label, value, href]) => (
          <Link key={label} href={href} className="jws-card portal-overview-stat">
            <span className="text-sm font-medium text-muted"><T text={label} /></span>
            <strong className="text-2xl font-semibold tabular-nums">{value}</strong>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {queues.map(({ title, empty, rows }) => (
          <section key={title} className="jws-card min-w-0">
            <h2 className="border-b border-border px-4 py-3 font-semibold"><T text={title} /></h2>
            {rows.length === 0 ? <p className="p-4 text-sm text-muted"><T text={empty} /></p> : (
              <ul className="divide-y divide-border">
                {rows.map(({ href, name, details, date, badge }) => (
                  <li key={href} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <Link href={href} className="text-sm font-semibold text-primary underline underline-offset-2">{name}</Link>
                      <p className="text-xs text-muted">{details} · <PortalDate value={date.toISOString()} /></p>
                    </div>
                    {badge}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div id="notifications"><PushNotificationControl vapidPublicKey={process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ?? ""} /></div>
    </div>
  );
}
