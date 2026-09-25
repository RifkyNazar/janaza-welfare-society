import type { Metadata } from "next";
import { updateSupervisorAccess } from "@/app/admin/(protected)/employees/actions";
import { SupervisorRoleAction } from "@/components/admin/supervisor-role-action";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { StatusMessage } from "@/components/status-message";

export const metadata: Metadata = { title: "Supervisor Management" };

export default async function SupervisorsPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  await requireAdmin();
  const updated = (await searchParams).updated === "1";
  const [supervisors, employees] = await Promise.all([
    prisma.user.findMany({ where: { role: "SUPERVISOR", status: "APPROVED" }, orderBy: { employeeProfile: { fullName: "asc" } }, select: { id: true, email: true, employeeProfile: { select: { fullName: true, employeeCode: true, position: true } } } }),
    prisma.user.findMany({ where: { role: "EMPLOYEE", status: "APPROVED", employeeProfile: { isNot: null } }, orderBy: { employeeProfile: { fullName: "asc" } }, select: { id: true, email: true, employeeProfile: { select: { fullName: true, employeeCode: true, position: true } } } }),
  ]);

  return <div className="mx-auto max-w-6xl">
    <p className="text-sm font-semibold text-primary">Administrative access</p><h1 className="mt-1 text-3xl font-semibold">Supervisors</h1><p className="mt-2 text-sm text-muted">Promote approved employees or remove Supervisor access without deleting accounts or history.</p>
    {updated && <StatusMessage className="mt-5">Supervisor access updated successfully.</StatusMessage>}
    <UserSection title="Current Supervisors" empty="No approved Supervisors." users={supervisors} grant={false} />
    <UserSection title="Eligible Approved Employees" empty="No approved employees are currently eligible." users={employees} grant />
  </div>;
}

type ManagedUser = { id: number; email: string; employeeProfile: { fullName: string; employeeCode: string; position: string } | null };
function UserSection({ title, empty, users, grant }: { title: string; empty: string; users: ManagedUser[]; grant: boolean }) {
  return <section className="mt-8"><h2 className="text-xl font-semibold">{title}</h2><div className="mt-4 space-y-3">{users.length ? users.map((user) => <article key={user.id} className="grid gap-4 rounded-2xl border border-border bg-white p-5 md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-semibold">{user.employeeProfile?.fullName ?? "Profile unavailable"}</p><p className="mt-1 text-sm text-muted">{user.employeeProfile?.employeeCode} · {user.employeeProfile?.position}</p><p className="mt-1 break-all text-xs text-muted">{user.email}</p></div><SupervisorRoleAction action={updateSupervisorAccess.bind(null, user.id, grant)} grant={grant} /></article>) : <p className="rounded-2xl border border-border bg-white p-6 text-sm text-muted">{empty}</p>}</div></section>;
}
