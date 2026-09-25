import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { EmployeeActions } from "@/components/admin/employee-actions";
import { EmployeeStatusBadge } from "@/components/admin/employee-status-badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { updateOperationalRole } from "../actions";

export const metadata: Metadata = { title: "Employee Details" };

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id: idParameter } = await params;
  if (!/^\d+$/.test(idParameter)) notFound();
  const id = Number(idParameter);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const employee = await prisma.user.findFirst({
    where: { id, role: { in: ["EMPLOYEE", "SUPERVISOR"] } },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      employeeProfile: {
        select: {
          fullName: true,
          employeeCode: true,
          phone: true,
          position: true,
          duty: true,
          photoUrl: true,
          isPublicProfile: true,
          taskAssignments: { select: { status: true } },
        },
      },
    },
  });

  if (!employee) notFound();

  const tasks = employee.employeeProfile?.taskAssignments ?? [];
  const activeTasks = tasks.filter((task) => task.status === "ASSIGNED" || task.status === "ACKNOWLEDGED" || task.status === "IN_PROGRESS").length;
  const completedTasks = tasks.filter((task) => task.status === "COMPLETED").length;
  const profile = employee.employeeProfile;

  const accountItems = [
    ["Email", employee.email],
    ["Role", employee.role],
    ["Status", employee.status],
    ["Created", dateTimeFormatter.format(employee.createdAt)],
    ["Updated", dateTimeFormatter.format(employee.updatedAt)],
  ];
  const profileItems = [
    ["Full Name", profile?.fullName ?? "—"],
    ["Employee Code", profile?.employeeCode ?? "—"],
    ["Phone", profile?.phone ?? "—"],
    ["Position", profile?.position ?? "—"],
    ["Duty", profile?.duty ?? "—"],
    ["Photo URL", profile?.photoUrl ?? "—"],
    ["Public Profile", profile?.isPublicProfile ? "Visible" : "Hidden"],
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <BackButton fallbackHref="/admin/employees" label="Back to Employees" />

      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold text-primary">Employee Account</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{profile?.fullName ?? "Employee Details"}</h1>
          <div className="mt-3"><EmployeeStatusBadge status={employee.status} /></div>
        </div>
        <EmployeeActions userId={employee.id} status={employee.status} />
      </div>
      <form action={updateOperationalRole.bind(null, employee.id)} className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-end"><div className="flex-1"><label htmlFor="role" className="text-sm font-semibold">Operational role</label><select id="role" name="role" defaultValue={employee.role} className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4"><option value="EMPLOYEE">Employee</option><option value="SUPERVISOR">Supervisor</option></select></div><button className="min-h-12 rounded-xl bg-primary px-6 text-sm font-semibold">Update Role</button><p className="text-xs text-muted sm:max-w-xs">Only Admin can promote or demote Supervisor accounts. Public registration always creates an Employee.</p></form>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
          <h2 className="text-lg font-semibold">Account</h2>
          <dl className="mt-5 divide-y divide-border">
            {accountItems.map(([label, item]) => (
              <div key={label} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
                <dd className="break-all text-sm">{item}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
          <h2 className="text-lg font-semibold">Employee Profile</h2>
          <dl className="mt-5 divide-y divide-border">
            {profileItems.map(([label, item]) => (
              <div key={label} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
                <dd className="break-all text-sm">{item}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
        <h2 className="text-lg font-semibold">Task Summary</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[["Total Assigned Tasks", tasks.length], ["Active Tasks", activeTasks], ["Completed Tasks", completedTasks]].map(([label, count]) => (
            <div key={label} className="rounded-xl border border-border bg-light-background p-4">
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{count}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
