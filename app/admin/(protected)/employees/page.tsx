import type { Metadata } from "next";
import Link from "next/link";
import type { AccountStatus } from "@/generated/prisma/enums";
import { EmployeeActions } from "@/components/admin/employee-actions";
import { EmployeeStatusBadge } from "@/components/admin/employee-status-badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "Employee Management" };

const statuses = ["ALL", "PENDING", "APPROVED", "REJECTED", "DISABLED"] as const;
const accountStatuses = new Set<AccountStatus>(["PENDING", "APPROVED", "REJECTED", "DISABLED"]);
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

type EmployeesPageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function EmployeesPage({ searchParams }: EmployeesPageProps) {
  await requireAdmin();

  const parameters = await searchParams;
  const requestedStatus = parameters.status?.toUpperCase();
  const status = requestedStatus === "ALL"
    ? "ALL"
    : requestedStatus && accountStatuses.has(requestedStatus as AccountStatus)
      ? requestedStatus as AccountStatus
      : "PENDING";
  const query = parameters.q?.trim().slice(0, 100) ?? "";

  const employees = await prisma.user.findMany({
    where: {
      role: "EMPLOYEE",
      ...(status !== "ALL" ? { status } : {}),
      ...(query ? {
        OR: [
          { email: { contains: query } },
          { employeeProfile: { is: { fullName: { contains: query } } } },
          { employeeProfile: { is: { employeeCode: { contains: query } } } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      employeeProfile: {
        select: {
          fullName: true,
          employeeCode: true,
          phone: true,
          position: true,
          isPublicProfile: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Employees</h1>
          <p className="mt-2 text-sm text-muted">Review registrations and manage employee account access.</p>
        </div>
        <p className="text-sm text-muted"><span className="font-semibold text-foreground">{employees.length}</span> result{employees.length === 1 ? "" : "s"}</p>
      </div>

      <div className="mt-7 rounded-2xl border border-border bg-white p-4 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statuses.map((item) => {
            const href = `/admin/employees?status=${item}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
            const active = item === status;
            return <Link key={item} href={href} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${active ? "bg-primary text-foreground" : "border border-border text-muted hover:border-primary hover:text-foreground"}`}>{item[0] + item.slice(1).toLowerCase()}</Link>;
          })}
        </div>

        <form action="/admin/employees" method="get" className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="employee-search" className="sr-only">Search employees</label>
          <input id="employee-search" name="q" type="search" defaultValue={query} placeholder="Search name, employee code, or email" className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <button type="submit" className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-foreground/90">Search</button>
          {query && <Link href={`/admin/employees?status=${status}`} className="rounded-xl border border-border px-5 py-2.5 text-center text-sm font-semibold text-muted hover:text-foreground">Clear</Link>}
        </form>
      </div>

      <section aria-label="Employee accounts" className="mt-6 space-y-3">
        {employees.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white px-6 py-14 text-center">
            <p className="font-semibold">No employees found</p>
            <p className="mt-2 text-sm text-muted">Try another status filter or search term.</p>
          </div>
        ) : employees.map((employee) => {
          const profile = employee.employeeProfile;
          return (
            <article key={employee.id} className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_26px_rgba(16,42,42,0.035)]">
              <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr_1fr_1fr_auto] lg:items-center">
                <div>
                  <p className="font-semibold">{profile?.fullName ?? "Profile unavailable"}</p>
                  <p className="mt-1 text-sm text-muted">{profile?.employeeCode ?? "No employee code"}</p>
                  <p className="mt-1 break-all text-xs text-muted">{employee.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Contact</p>
                  <p className="mt-1 text-sm">{profile?.phone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Position</p>
                  <p className="mt-1 text-sm">{profile?.position ?? "—"}</p>
                  <p className="mt-1 text-xs text-muted">Registered {dateFormatter.format(employee.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:block">
                  <EmployeeStatusBadge status={employee.status} />
                  <p className="mt-0 text-xs text-muted lg:mt-2">Public profile: {profile?.isPublicProfile ? "Visible" : "Hidden"}</p>
                </div>
                <EmployeeActions userId={employee.id} status={employee.status} />
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
