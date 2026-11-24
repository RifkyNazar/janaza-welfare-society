"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { Prisma } from "@/generated/prisma/client";
import { isEmployeePin, normalizeEmployeePhone, NO_STAFF_PASSWORD, PIN_ONLY_EMAIL_SUFFIX } from "@/lib/employee-phone";
import { clearEmployeeLoginThrottle, hashEmployeeCode } from "@/lib/employee-pin";
import { assertEmployeeAccountPhonesAvailable, assertEmployeePhonesAvailable, EmployeePhoneConflict, employeePhoneTransaction, lockEmployeePhoneAccount } from "@/lib/employee-phone-registration";

const phoneConflictMessage = "This phone is already in use by another employee account. Review the duplicate phone report before continuing.";

export type EmployeeActionState = {
  error?: string;
  success?: string;
  values?: { fullName: string; phone: string; position: string };
};

export async function saveEmployee(id: number | null, _state: EmployeeActionState, form: FormData): Promise<EmployeeActionState> {
  const admin = await requireAdmin();
  if (id !== null && (!Number.isSafeInteger(id) || id < 1)) return { error: "Invalid employee." };
  const text = (field: string) => {
    const value = form.get(field);
    return typeof value === "string" ? value.trim() : "";
  };
  const fullName = text("fullName"), position = text("position");
  const rawCode = form.get("code");
  const code = typeof rawCode === "string" ? rawCode : "";
  const values = { fullName, phone: text("phone"), position };
  const phone = normalizeEmployeePhone(values.phone);
  if (!fullName || fullName.length > 150 || !position || position.length > 150 || !phone) {
    return { error: "Enter a name, position and valid Sri Lankan phone number.", values };
  }
  if ((id === null || code) && !isEmployeePin(code)) return { error: "Enter a six-digit login code.", values };

  try {
    const pinHash = code ? await hashEmployeeCode(code) : null;
    const saved = await employeePhoneTransaction(async tx => {
      if (id !== null) await lockEmployeePhoneAccount(tx, id);
      const current = id === null ? null : await tx.user.findFirst({
        where: { id, role: "EMPLOYEE", employeeProfile: { isNot: null } },
        select: { id: true, employeeSessionVersion: true, employeeProfile: { select: { fullName: true, position: true } }, employeePin: { select: { phone: true, pinHash: true } } },
      });
      if (id !== null && !current) return false;
      await assertEmployeePhonesAvailable(tx, [phone], id ?? undefined);
      const profile = { fullName, phone, position };
      const credentials = (hash: string | null, version: number) => ({
        phone, pinHash: hash, setupDigest: null, setupUntil: null, setupVersion: version,
        issuedAt: new Date(), issuedById: Number(admin.user.id),
      });
      if (!current) {
        const reference = randomUUID();
        await tx.user.create({ data: { email: reference + PIN_ONLY_EMAIL_SUFFIX, passwordHash: NO_STAFF_PASSWORD,
          role: "EMPLOYEE", status: "APPROVED",
          employeeProfile: { create: { ...profile, employeeCode: "JWS-" + reference } },
          employeePin: { create: credentials(pinHash, 0) },
        } });
      } else {
        await tx.employeeProfile.update({ where: { userId: current.id }, data: { ...profile, ...(current.employeeProfile?.fullName !== fullName || current.employeeProfile?.position !== position ? { isPublicProfile: false } : {}) } });
        if (pinHash || (current.employeePin && current.employeePin.phone !== phone)) {
          const data = credentials(pinHash ?? current.employeePin?.pinHash ?? null, current.employeeSessionVersion + 1);
          await tx.user.update({ where: { id: current.id }, data: { employeeSessionVersion: { increment: 1 } } });
          await tx.employeePinCredential.upsert({ where: { userId: current.id }, create: { userId: current.id, ...data }, update: data });
          await tx.employeePinSession.deleteMany({ where: { userId: current.id } });
        }
      }
      return true;
    });
    if (!saved) return { error: "Employee account not found.", values };
    if (code) await clearEmployeeLoginThrottle(phone).catch(() => console.warn("[employee] Could not clear the account login throttle."));
  } catch (error) {
    if (error instanceof EmployeePhoneConflict || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) return { error: phoneConflictMessage, values };
    return { error: "Unable to save the employee account.", values };
  }
  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/admin");
  revalidatePath("/admin/employees");
  revalidatePath("/admin/employees/phone-conflicts");
  revalidatePath("/supervisor/employees");
  if (id === null) redirect("/admin/employees");
  revalidatePath(`/admin/employees/${id}`);
  return { success: "Employee saved." };
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
  disable: { from: ["APPROVED"], to: "DISABLED" },
  reactivate: { from: ["DISABLED", "PENDING", "REJECTED"], to: "APPROVED" },
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
        const credential = await tx.employeePinCredential.findUnique({ where: { userId: employeeId }, select: { pinHash: true } });
        if (!credential?.pinHash) throw new Error("EMPLOYEE_CODE_REQUIRED");
      }
      if (changed.count) await tx.employeePinSession.deleteMany({ where: { userId: employeeId } });
      return changed;
    });
  } catch (error) {
    if (error instanceof EmployeePhoneConflict) return { error: phoneConflictMessage };
    if (error instanceof Error && error.message === "EMPLOYEE_CODE_REQUIRED") return { error: "Assign a login code before activating this employee." };
    throw error;
  }

  if (result.count !== 1) {
    return { error: "The account changed before this action completed. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/team");
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
