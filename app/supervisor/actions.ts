"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminOrSupervisor } from "@/lib/permissions";
import { notifyAssignedEmployee } from "@/lib/notifications";

export type DispatchState = { error?: string; success?: string };
class DispatchConflict extends Error {}

export async function assignEmployee(requestId: number, _state: DispatchState, formData: FormData): Promise<DispatchState> {
  const session = await requireAdminOrSupervisor();
  const actorId = Number(session.user.id);
  const employeeId = Number(formData.get("employeeId"));
  if (![requestId, employeeId, actorId].every((id) => Number.isSafeInteger(id) && id > 0)) return { error: "Invalid assignment." };
  try {
    const taskId = await prisma.$transaction(async (tx) => {
      const employee = await tx.employeeProfile.findFirst({ where: { id: employeeId, availability: "AVAILABLE", user: { role: "EMPLOYEE", status: "APPROVED" } }, select: { id: true } });
      if (!employee) throw new DispatchConflict();
      const request = await tx.serviceRequest.updateMany({ where: { id: requestId, status: "NEW", taskAssignments: { none: { isActive: true } } }, data: { status: "ASSIGNED" } });
      if (request.count !== 1) throw new DispatchConflict();
      const task = await tx.taskAssignment.create({ data: { requestId, activeRequestId: requestId, employeeId, assignedByUserId: actorId, isActive: true, status: "ASSIGNED" }, select: { id: true } });
      return task.id;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    await notifyAssignedEmployee(taskId);
  } catch (error) {
    if (error instanceof DispatchConflict || (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034"))) return { error: "This request was assigned or changed before the action completed. Refresh and try again." };
    throw error;
  }
  refresh(requestId); return { success: "Employee assigned." };
}

export async function reassignEmployee(requestId: number, _state: DispatchState, formData: FormData): Promise<DispatchState> {
  const session = await requireAdminOrSupervisor();
  const actorId = Number(session.user.id); const employeeId = Number(formData.get("employeeId"));
  if (![requestId, employeeId, actorId].every((id) => Number.isSafeInteger(id) && id > 0)) return { error: "Invalid reassignment." };
  try {
    const taskId = await prisma.$transaction(async (tx) => {
      const employee = await tx.employeeProfile.findFirst({ where: { id: employeeId, availability: "AVAILABLE", user: { role: "EMPLOYEE", status: "APPROVED" } }, select: { id: true } });
      if (!employee) throw new DispatchConflict();
      const current = await tx.taskAssignment.findUnique({ where: { activeRequestId: requestId }, select: { id: true, employeeId: true, status: true } });
      if (!current || current.employeeId === employeeId || current.status === "COMPLETED" || current.status === "CANCELLED") throw new DispatchConflict();
      const retired = await tx.taskAssignment.updateMany({ where: { id: current.id, activeRequestId: requestId, isActive: true }, data: { activeRequestId: null, isActive: false, status: "CANCELLED", unassignedAt: new Date() } });
      if (retired.count !== 1) throw new DispatchConflict();
      const task = await tx.taskAssignment.create({ data: { requestId, activeRequestId: requestId, employeeId, assignedByUserId: actorId, isActive: true, status: "ASSIGNED" }, select: { id: true } });
      await tx.serviceRequest.update({ where: { id: requestId }, data: { status: "ASSIGNED" } });
      return task.id;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    await notifyAssignedEmployee(taskId);
  } catch (error) {
    if (error instanceof DispatchConflict || (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034"))) return { error: "The active assignment changed. Refresh before trying again." };
    throw error;
  }
  refresh(requestId); return { success: "Task reassigned and prior history retained." };
}

function refresh(requestId: number) { revalidatePath("/supervisor"); revalidatePath("/supervisor/requests"); revalidatePath("/supervisor/tasks"); revalidatePath(`/supervisor/requests/${requestId}`); revalidatePath("/employee"); revalidatePath("/employee/my-tasks"); revalidatePath("/admin"); revalidatePath("/admin/service-requests"); }
