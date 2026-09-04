import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function userId(value: string | undefined) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function requireAdmin() {
  const session = await auth();
  const id = userId(session?.user.id);
  const account = id
    ? await prisma.user.findUnique({ where: { id }, select: { role: true, status: true } })
    : null;

  if (!session || account?.role !== "ADMIN" || account.status !== "APPROVED") {
    redirect("/admin/login");
  }

  return session;
}

export async function requireEmployee() {
  const session = await auth();
  const id = userId(session?.user.id);
  const account = id
    ? await prisma.user.findUnique({
        where: { id },
        select: { role: true, status: true, employeeProfile: { select: { id: true } } },
      })
    : null;

  if (!session || account?.role !== "EMPLOYEE" || account.status !== "APPROVED") {
    redirect("/employee-access/login");
  }

  session.user.employeeProfileId = account.employeeProfile?.id ?? null;

  return session;
}
