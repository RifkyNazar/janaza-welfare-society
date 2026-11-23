"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Prisma } from "@/generated/prisma/client";
import { normalizeEmployeePhone, NO_STAFF_PASSWORD } from "@/lib/employee-phone";
import { issuePinSetup } from "@/lib/employee-pin";
import { assertEmployeeAccountPhonesAvailable, EmployeePhoneConflict, employeePhoneTransaction } from "@/lib/employee-phone-registration";

const phoneConflictMessage = "This phone is already in use by another employee account. Review the duplicate phone report before continuing.";

export type EmployeeActionState = {
  error?: string;
  success?: string;
};

export type EmployeePinIssueState = EmployeeActionState & { token?: string; expiresAt?: string };

export async function issueEmployeePinSetup(userId: number, _state: EmployeePinIssueState, form: FormData): Promise<EmployeePinIssueState> {
  const admin = await requireAdmin();
  if (!Number.isSafeInteger(userId) || userId <= 0) return { error: "Invalid employee account." };
  const input = form.get("phone");
  const phone = typeof input === "string" ? normalizeEmployeePhone(input) : null;
  if (!phone || form.get("identityVerified") !== "on") return { error: "Verify the employee’s identity and enter their verified Sri Lankan phone number." };
  try {
    const issued = await issuePinSetup(userId, Number(admin.user.id), phone);
    if (!issued) return { error: "Approve this employee before issuing a setup token." };
    revalidatePath(`/admin/employees/${userId}`);
    revalidatePath("/admin/employees/phone-conflicts");
    return issued;
  } catch (error) {
    if (error instanceof EmployeePhoneConflict || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      return { error: phoneConflictMessage };
    }
    return { error: "Unable to issue a setup token right now." };
  }
}

export async function setPublicEmployee(userId: number, visible: boolean, reviewedAt: number, _state: EmployeeActionState, _data: FormData): Promise<EmployeeActionState> {
  void _state; void _data;
  await requireAdmin();
  if (!Number.isSafeInteger(userId) || userId <= 0 || typeof visible !== "boolean") return { error: "Invalid employee." };
  const reviewedVersion = new Date(reviewedAt);
  if (visible && (!Number.isSafeInteger(reviewedAt) || Number.isNaN(reviewedVersion.getTime()))) return { error: "Review the current profile before approving it." };
  const result = await prisma.employeeProfile.updateMany({
    where: { userId, ...(visible ? { updatedAt: reviewedVersion, user: { role: "EMPLOYEE", status: "APPROVED" } } : {}) },
    data: { isPublicProfile: visible },
  });
  if (result.count !== 1) return { error: visible ? "Review the current profile before approving it." : "Employee profile not found." };
  revalidatePath("/"); revalidatePath("/team"); revalidatePath("/admin/employees"); revalidatePath(`/admin/employees/${userId}`);
  return { success: visible ? "Reviewed profile approved for public display." : "Profile hidden from public display." };
}

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

  if (!Object.hasOwn(transitions, transitionName)) {
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

  let result;
  try {
    result = await employeePhoneTransaction(async tx => {
      const changed = await tx.user.updateMany({
        where: { id: employeeId, role: user.role, status: user.status },
        data: { status: transition.to, employeeSessionVersion: { increment: 1 } },
      });
      if (changed.count && user.role === "EMPLOYEE" && transition.to === "APPROVED") {
        await assertEmployeeAccountPhonesAvailable(tx, employeeId);
      }
      return changed;
    });
  } catch (error) {
    if (error instanceof EmployeePhoneConflict) return { error: phoneConflictMessage };
    throw error;
  }

  if (result.count !== 1) {
    return { error: "The account changed before this action completed. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  revalidatePath("/admin/employees/phone-conflicts");
  revalidatePath(`/admin/employees/${employeeId}`);

  return { success: "Employee account status updated." };
}

export async function updateSupervisorAccess(userId: number, grant: boolean, _state: EmployeeActionState, _formData: FormData): Promise<EmployeeActionState> {
  void _state; void _formData;
  await requireAdmin();
  if (!Number.isSafeInteger(userId) || userId <= 0) return { error: "Invalid employee account." };
  const currentRole = grant ? "EMPLOYEE" : "SUPERVISOR";
  const nextRole = grant ? "SUPERVISOR" : "EMPLOYEE";
  let result;
  try {
    result = await employeePhoneTransaction(async tx => {
      const changed = await tx.user.updateMany({
        where: { id: userId, role: currentRole, status: "APPROVED", employeeProfile: { isNot: null },
          ...(grant ? { passwordHash: { not: NO_STAFF_PASSWORD } } : {}) },
        data: { role: nextRole, employeeSessionVersion: { increment: 1 } },
      });
      if (changed.count && nextRole === "EMPLOYEE") await assertEmployeeAccountPhonesAvailable(tx, userId);
      return changed;
    });
  } catch (error) {
    if (error instanceof EmployeePhoneConflict) return { error: phoneConflictMessage };
    throw error;
  }
  if (result.count !== 1) return { error: grant ? "Only an approved employee with existing staff password credentials can be promoted." : "Only an approved Supervisor can be demoted." };
  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  revalidatePath("/admin/employees/phone-conflicts");
  revalidatePath(`/admin/employees/${userId}`);
  revalidatePath("/admin/supervisors");
  revalidatePath("/supervisor");
  redirect("/admin/supervisors?updated=1");
}
