import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function userId(value: string | undefined) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

const dashboards = { ADMIN: "/admin", SUPERVISOR: "/supervisor", EMPLOYEE: "/employee" };
type Role = keyof typeof dashboards;

async function approvedAccount() {
  const session = await auth();
  const id = userId(session?.user?.id);
  const account = id ? await prisma.user.findUnique({
    where: { id },
    select: { role: true, status: true, employeeProfile: { select: { id: true } } },
  }) : null;
  if (!session || !account || account.status !== "APPROVED" || (session.user.role && account.role !== session.user.role)) return null;
  session.user.role = account.role;
  session.user.status = account.status;
  session.user.employeeProfileId = account.employeeProfile?.id ?? null;
  return session;
}

export async function currentStaffRole() {
  return (await approvedAccount())?.user.role ?? null;
}

async function requireRole(roles: readonly Role[], loginPath: string) {
  const session = await approvedAccount();
  if (!session) redirect(loginPath);
  if (!roles.includes(session.user.role)) redirect(dashboards[session.user.role]);
  return session;
}

export function requireAdmin() {
  return requireRole(["ADMIN"], "/admin/login");
}

export function requireEmployee() {
  return requireRole(["EMPLOYEE"], "/employee-access/login");
}

export function requireSupervisor() {
  return requireRole(["SUPERVISOR"], "/supervisor-login");
}

export function requireAdminOrSupervisor() {
  return requireRole(["ADMIN", "SUPERVISOR"], "/supervisor-login");
}

export async function redirectAuthenticatedUser(roles: readonly Role[]) {
  const session = await approvedAccount();
  if (session && roles.includes(session.user.role)) redirect(dashboards[session.user.role]);
}
