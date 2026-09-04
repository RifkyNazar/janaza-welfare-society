import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";

export const metadata: Metadata = { title: "Employee Dashboard" };

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function EmployeeDashboardPage() {
  const session = await requireEmployee();
  const profileId = session.user.employeeProfileId;

  const [availableRequests, activeTasks, completedTasks, recentRequests] = await Promise.all([
    prisma.serviceRequest.count({ where: { status: "NEW" } }),
    profileId ? prisma.taskAssignment.count({ where: { employeeId: profileId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } } }) : 0,
    profileId ? prisma.taskAssignment.count({ where: { employeeId: profileId, status: "COMPLETED" } }) : 0,
    prisma.serviceRequest.findMany({
      where: { status: "NEW" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, requestCode: true, serviceType: true, area: true, requiredDate: true },
    }),
  ]);

  const summaries = [
    ["Available Requests", availableRequests, "/employee/tasks"],
    ["My Active Tasks", activeTasks, "/employee/my-tasks"],
    ["Completed Tasks", completedTasks, "/employee/completed"],
  ] as const;

  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-semibold text-primary">Overview</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Employee Dashboard</h1>
      <p className="mt-2 text-sm text-muted">Available service work and your current task progress.</p>

      <section aria-label="Task summary" className="mt-8 grid gap-4 sm:grid-cols-3">
        {summaries.map(([label, count, href]) => (
          <Link key={label} href={href} className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_rgba(16,42,42,0.05)] transition hover:border-primary/50">
            <span aria-hidden="true" className="absolute right-0 top-0 size-16 translate-x-5 -translate-y-5 rotate-45 border border-primary/25" />
            <p className="text-sm font-medium text-muted">{label}</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{count}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_30px_rgba(16,42,42,0.04)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">Recent Available Requests</h2>
          <Link href="/employee/tasks" className="text-xs font-semibold text-muted underline decoration-primary decoration-2 underline-offset-4 hover:text-foreground">View all</Link>
        </div>
        <div className="divide-y divide-border">
          {recentRequests.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted">No requests are currently available.</p> : recentRequests.map((request) => (
            <Link key={request.id} href={`/employee/tasks/${request.id}`} className="grid gap-2 px-5 py-4 transition hover:bg-light-background sm:grid-cols-[1fr_1fr_auto] sm:items-center">
              <div><p className="text-xs font-semibold text-primary">{request.requestCode}</p><p className="mt-1 text-sm font-semibold">{request.serviceType}</p></div>
              <p className="text-sm text-muted">{request.area}</p>
              <p className="text-xs text-muted">Required {dateFormatter.format(request.requiredDate)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
