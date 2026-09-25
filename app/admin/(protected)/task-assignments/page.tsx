import type { Metadata } from "next";
import Link from "next/link";
import type { TaskStatus } from "@/generated/prisma/enums";
import { TaskStatusBadge } from "@/components/employee/task-status-badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "Task Assignments" };

const statuses = ["ALL", "ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS", "COMPLETED"] as const;
const filterStatuses = new Set<TaskStatus>(["ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS", "COMPLETED"]);
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function TaskAssignmentsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin();

  const parameters = await searchParams;
  const requestedStatus = parameters.status?.toUpperCase();
  const status = requestedStatus === "ALL"
    ? "ALL"
    : requestedStatus && filterStatuses.has(requestedStatus as TaskStatus)
      ? requestedStatus as TaskStatus
      : "ALL";
  const query = parameters.q?.trim().slice(0, 100) ?? "";

  const [assignedCount, inProgressCount, completedCount, assignments] = await Promise.all([
    prisma.taskAssignment.count({ where: { status: "ASSIGNED" } }),
    prisma.taskAssignment.count({ where: { status: "IN_PROGRESS" } }),
    prisma.taskAssignment.count({ where: { status: "COMPLETED" } }),
    prisma.taskAssignment.findMany({
      where: {
        ...(status !== "ALL" ? { status } : {}),
        ...(query ? {
          OR: [
            { request: { is: { requestCode: { contains: query } } } },
            { request: { is: { area: { contains: query } } } },
            { employee: { is: { fullName: { contains: query } } } },
            { employee: { is: { employeeCode: { contains: query } } } },
          ],
        } : {}),
      },
      orderBy: { acceptedAt: "desc" },
      select: {
        id: true,
        status: true,
        acceptedAt: true,
        startedAt: true,
        completedAt: true,
        employee: { select: { fullName: true, employeeCode: true } },
        request: { select: { requestCode: true, serviceType: true, area: true, requiredDate: true } },
      },
    }),
  ]);

  const summaries = [["Assigned", assignedCount], ["In Progress", inProgressCount], ["Completed", completedCount]] as const;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold text-primary">Oversight</p><h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Task Assignments</h1><p className="mt-2 text-sm text-muted">Monitor employee assignments and task progress.</p></div>
        <p className="text-sm text-muted"><span className="font-semibold text-foreground">{assignments.length}</span> result{assignments.length === 1 ? "" : "s"}</p>
      </div>

      <section aria-label="Assignment summary" className="mt-8 grid gap-4 sm:grid-cols-3">
        {summaries.map(([label, count]) => <article key={label} className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_rgba(16,42,42,0.05)]"><span aria-hidden="true" className="absolute right-0 top-0 size-16 translate-x-5 -translate-y-5 rotate-45 border border-primary/25" /><p className="text-sm font-medium text-muted">{label}</p><p className="mt-3 text-3xl font-semibold tabular-nums">{count}</p></article>)}
      </section>

      <div className="mt-6 rounded-2xl border border-border bg-white p-4 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statuses.map((item) => {
            const href = `/admin/task-assignments?status=${item}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
            const label = item === "IN_PROGRESS" ? "In Progress" : item[0] + item.slice(1).toLowerCase();
            return <Link key={item} href={href} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${item === status ? "bg-primary text-foreground" : "border border-border text-muted hover:border-primary hover:text-foreground"}`}>{label}</Link>;
          })}
        </div>
        <form action="/admin/task-assignments" method="get" className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="assignment-search" className="sr-only">Search task assignments</label>
          <input id="assignment-search" name="q" type="search" defaultValue={query} placeholder="Search request code, employee, code, or area" className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <button type="submit" className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-white hover:bg-foreground/90">Search</button>
          {query && <Link href={`/admin/task-assignments?status=${status}`} className="rounded-xl border border-border px-5 py-2.5 text-center text-sm font-semibold text-muted hover:text-foreground">Clear</Link>}
        </form>
      </div>

      <section aria-label="Task assignment records" className="mt-6 space-y-4">
        {assignments.length === 0 ? <div className="rounded-2xl border border-border bg-white px-6 py-14 text-center"><p className="font-semibold">No task assignments found</p><p className="mt-2 text-sm text-muted">Try another status filter or search term.</p></div> : assignments.map((assignment) => (
          <article key={assignment.id} className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_26px_rgba(16,42,42,0.035)]">
            <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_1fr_1.35fr_auto] xl:items-center">
              <div><p className="text-xs font-semibold text-primary">{assignment.request.requestCode}</p><p className="mt-1 font-semibold">{assignment.request.serviceType}</p><p className="mt-1 text-sm text-muted">{assignment.request.area}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Employee</p><p className="mt-1 text-sm font-semibold">{assignment.employee.fullName}</p><p className="mt-1 text-xs text-muted">{assignment.employee.employeeCode}</p></div>
              <div><TaskStatusBadge status={assignment.status} /><p className="mt-2 text-xs text-muted">Required {dateFormatter.format(assignment.request.requiredDate)}</p></div>
              <div className="grid grid-cols-1 gap-1 text-xs text-muted sm:grid-cols-3 xl:grid-cols-1"><p>Accepted: {dateTimeFormatter.format(assignment.acceptedAt)}</p><p>Started: {assignment.startedAt ? dateTimeFormatter.format(assignment.startedAt) : "—"}</p><p>Completed: {assignment.completedAt ? dateTimeFormatter.format(assignment.completedAt) : "—"}</p></div>
              <Link href={`/admin/task-assignments/${assignment.id}`} className="min-h-11 rounded-xl border border-border px-4 py-2.5 text-center text-sm font-semibold hover:border-primary hover:bg-light-background">View Details</Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
