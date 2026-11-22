import { getPortalTranslation } from "@/lib/portal-language";
import { T } from "@/components/public-language";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { EmployeeActions } from "@/components/admin/employee-actions";
import { EmployeeStatusBadge } from "@/components/admin/employee-status-badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import Image from "next/image";
import { profilePhotoSrc } from "@/lib/profile-photo-storage";
import { EmployeeStatusAction } from "@/components/admin/employee-status-action";
import { setPublicEmployee } from "../actions";

export const metadata: Metadata = { title: "Employee Details" };



export default async function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { dateLocale, t } = await getPortalTranslation();
  const dateTimeFormatter = new Intl.DateTimeFormat(dateLocale, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
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
          updatedAt: true,
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
          <p className="text-sm font-semibold text-primary"><T text="Employee Account" /></p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{profile?.fullName ?? <T text="Employee Details" />}</h1>
          <div className="mt-3"><EmployeeStatusBadge status={employee.status} /></div>
        </div>
        <EmployeeActions userId={employee.id} status={employee.status} />
      </div>
      <div className="mt-6 rounded-2xl border border-border bg-white p-5 text-sm text-muted"><T text="Supervisor access is managed from the dedicated" /> <a href="/admin/supervisors" className="font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4"><T text="Supervisor Management" /></a> <T text="page with confirmation." /></div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
          <h2 className="text-lg font-semibold"><T text="Account" /></h2>
          <dl className="mt-5 divide-y divide-border">
            {accountItems.map(([label, item]) => (
              <div key={label} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t(label)}</dt>
                <dd className="break-all text-sm">{item}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
          <h2 className="text-lg font-semibold"><T text="Employee Profile" /></h2>
          <dl className="mt-5 divide-y divide-border">
            {profileItems.map(([label, item]) => (
              <div key={label} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t(label)}</dt>
                <dd className="break-all text-sm">{item}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {profile && <section className="mt-6 rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold"><T text="Public team visibility" /></h2><p className="my-4 text-sm text-muted"><T text="Review the name, position, duty and photo above before approving public display. Phone, email, employee code and private tasks stay private. Employee changes to name, duty or photo require approval again." /></p>{profile.photoUrl && <Image unoptimized src={profilePhotoSrc(profile.photoUrl)!} alt={t("Employee profile for admin review")} width={240} height={240} className="mb-4 size-40 rounded-xl object-cover" />}{(profile.isPublicProfile || (employee.role === "EMPLOYEE" && employee.status === "APPROVED")) && <EmployeeStatusAction action={setPublicEmployee.bind(null, id, !profile.isPublicProfile, profile.updatedAt.getTime())} label={profile.isPublicProfile ? "Hide public profile" : "Approve public profile"} confirmation={profile.isPublicProfile ? undefined : "Approve the reviewed name, position, duty and photo for public display?"} />}</section>}

      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
        <h2 className="text-lg font-semibold"><T text="Task Summary" /></h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {([["Total Assigned Tasks", tasks.length], ["Active Tasks", activeTasks], ["Completed Tasks", completedTasks]] as const).map(([label, count]) => (
            <div key={label} className="rounded-xl border border-border bg-light-background p-4">
              <p className="text-sm text-muted"><T text={label} /></p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{count}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
