import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function userId(value: string | undefined) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function approvedAccount(roles: Array<"ADMIN" | "SUPERVISOR" | "EMPLOYEE">) {
  const session = await auth();
  const id = userId(session?.user.id);
  const account = id ? await prisma.user.findUnique({
    where: { id },
    select: { role: true, status: true, employeeProfile: { select: { id: true } } },
  }) : null;
  if (!session || !account || account.status !== "APPROVED" || !roles.includes(account.role)) return null;
  session.user.role = account.role;
  session.user.status = account.status;
  session.user.employeeProfileId = account.employeeProfile?.id ?? null;
  return session;
}

export async function requireAdmin() {
  const session = await approvedAccount(["ADMIN"]);
  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export async function requireEmployee() {
  const session = await approvedAccount(["EMPLOYEE"]);
  if (!session) {
    redirect("/employee-access/login");
  }

  return session;
}

export async function requireSupervisor() {
  const session = await approvedAccount(["SUPERVISOR"]);
  if (!session) redirect("/employee-access/login");
  return session;
}

export async function requireAdminOrSupervisor() {
  const session = await approvedAccount(["ADMIN", "SUPERVISOR"]);
  if (!session) redirect("/employee-access/login");
  return session;
}

export async function redirectAuthenticatedUser() {
  const session = await auth();
  const id = userId(session?.user.id);
  const account = id ? await prisma.user.findUnique({ where: { id }, select: { role: true, status: true } }) : null;
  if (!account || account.status !== "APPROVED") return;
  redirect(account.role === "ADMIN" ? "/admin" : account.role === "SUPERVISOR" ? "/supervisor" : "/employee");
}
