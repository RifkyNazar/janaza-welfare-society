"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export type EmployeeActionState = {
  error?: string;
  success?: string;
};

const transitions = {
  approve: { from: ["PENDING", "REJECTED"], to: "APPROVED" },
  reject: { from: ["PENDING"], to: "REJECTED" },
  disable: { from: ["APPROVED"], to: "DISABLED" },
  reactivate: { from: ["DISABLED"], to: "APPROVED" },
} as const;

export async function updateEmployeeStatus(
  employeeId: number,
  transitionName: string,
  _previousState: EmployeeActionState,
  _formData: FormData,
): Promise<EmployeeActionState> {
  void _previousState;
  void _formData;
  await requireAdmin();

  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    return { error: "Invalid employee account." };
  }

  if (!(transitionName in transitions)) {
    return { error: "Invalid employee status action." };
  }

  const transition = transitions[transitionName as keyof typeof transitions];
  const user = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { role: true, status: true },
  });

  if (!user || (user.role !== "EMPLOYEE" && user.role !== "SUPERVISOR")) {
    return { error: "Employee account not found." };
  }

  if (!(transition.from as readonly string[]).includes(user.status)) {
    return { error: "This action is not available for the employee's current status." };
  }

  const result = await prisma.user.updateMany({
    where: { id: employeeId, role: { in: ["EMPLOYEE", "SUPERVISOR"] }, status: user.status },
    data: { status: transition.to },
  });

  if (result.count !== 1) {
    return { error: "The account changed before this action completed. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${employeeId}`);

  return { success: "Employee account status updated." };
}

export async function updateSupervisorAccess(userId: number, grant: boolean, _state: EmployeeActionState, _formData: FormData): Promise<EmployeeActionState> {
  void _state; void _formData;
  await requireAdmin();
  if (!Number.isSafeInteger(userId) || userId <= 0) return { error: "Invalid employee account." };
  const currentRole = grant ? "EMPLOYEE" : "SUPERVISOR";
  const nextRole = grant ? "SUPERVISOR" : "EMPLOYEE";
  const result = await prisma.user.updateMany({
    where: { id: userId, role: currentRole, status: "APPROVED", employeeProfile: { isNot: null } },
    data: { role: nextRole },
  });
  if (result.count !== 1) return { error: grant ? "Only an approved employee can be promoted." : "Only an approved Supervisor can be demoted." };
  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${userId}`);
  revalidatePath("/admin/supervisors");
  revalidatePath("/supervisor");
  redirect("/admin/supervisors?updated=1");
}
