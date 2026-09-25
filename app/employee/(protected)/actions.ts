"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";

export type TaskActionState = { error?: string };

class TaskTransitionError extends Error {}

function validId(id: number) {
  return Number.isSafeInteger(id) && id > 0;
}

async function employeeProfileId() {
  const session = await requireEmployee();
  const profileId = session.user.employeeProfileId;
  return typeof profileId === "number" && validId(profileId) ? profileId : null;
}

export async function acceptTask(
  requestId: number,
  _previousState: TaskActionState,
  _formData: FormData,
): Promise<TaskActionState> {
  void _previousState;
  void _formData;
  await requireEmployee();
  void requestId;
  return { error: "Self-assignment is disabled. A supervisor must assign customer requests." };
}

export async function acknowledgeTask(taskId: number, _state: TaskActionState, _formData: FormData): Promise<TaskActionState> {
  void _state; void _formData;
  const profileId = await employeeProfileId();
  if (!profileId || !validId(taskId)) return { error: "Invalid task." };
  const now = new Date();
  const result = await prisma.taskAssignment.updateMany({
    where: { id: taskId, employeeId: profileId, isActive: true, status: "ASSIGNED" },
    data: { status: "ACKNOWLEDGED", acknowledgedAt: now, acceptedAt: now },
  });
  if (result.count !== 1) return { error: "This task can no longer be acknowledged." };
  revalidatePath("/employee"); revalidatePath("/employee/my-tasks"); revalidatePath(`/employee/my-tasks/${taskId}`);
  revalidatePath("/supervisor");
  return {};
}

export async function updateAvailability(formData: FormData): Promise<void> {
  const profileId = await employeeProfileId();
  const availability = formData.get("availability");
  if (!profileId || (availability !== "AVAILABLE" && availability !== "UNAVAILABLE")) return;
  await prisma.employeeProfile.update({ where: { id: profileId }, data: { availability } });
  revalidatePath("/employee"); revalidatePath("/supervisor/employees"); revalidatePath("/admin/employees");
}

export async function startTask(
  taskId: number,
  _previousState: TaskActionState,
  _formData: FormData,
): Promise<TaskActionState> {
  void _previousState;
  void _formData;
  const profileId = await employeeProfileId();

  if (!profileId) return { error: "Employee profile not found." };
  if (!validId(taskId)) return { error: "Invalid task." };

  try {
    await prisma.$transaction(async (transaction) => {
      const task = await transaction.taskAssignment.findFirst({
        where: { id: taskId, employeeId: profileId, isActive: true },
        select: { requestId: true, status: true },
      });
      if (!task || task.status !== "ACKNOWLEDGED") throw new TaskTransitionError();

      const requestUpdate = await transaction.serviceRequest.updateMany({
        where: { id: task.requestId, status: "ASSIGNED" },
        data: { status: "IN_PROGRESS" },
      });
      const taskUpdate = await transaction.taskAssignment.updateMany({
        where: { id: taskId, employeeId: profileId, isActive: true, status: "ACKNOWLEDGED" },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      });

      if (requestUpdate.count !== 1 || taskUpdate.count !== 1) throw new TaskTransitionError();
    });
  } catch (error) {
    if (error instanceof TaskTransitionError) {
      return { error: "This task can no longer be started." };
    }
    throw error;
  }

  revalidatePath("/employee");
  revalidatePath("/employee/my-tasks");
  revalidatePath(`/employee/my-tasks/${taskId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/service-requests");
  return {};
}

export async function completeTask(
  taskId: number,
  _previousState: TaskActionState,
  _formData: FormData,
): Promise<TaskActionState> {
  void _previousState;
  void _formData;
  const profileId = await employeeProfileId();

  if (!profileId) return { error: "Employee profile not found." };
  if (!validId(taskId)) return { error: "Invalid task." };

  try {
    await prisma.$transaction(async (transaction) => {
      const task = await transaction.taskAssignment.findFirst({
        where: { id: taskId, employeeId: profileId, isActive: true },
        select: { requestId: true, status: true },
      });
      if (!task || task.status !== "IN_PROGRESS") throw new TaskTransitionError();

      const completedAt = new Date();
      const requestUpdate = await transaction.serviceRequest.updateMany({
        where: { id: task.requestId, status: "IN_PROGRESS" },
        data: { status: "COMPLETED" },
      });
      const taskUpdate = await transaction.taskAssignment.updateMany({
        where: { id: taskId, employeeId: profileId, isActive: true, status: "IN_PROGRESS" },
        data: { status: "COMPLETED", completedAt },
      });

      if (requestUpdate.count !== 1 || taskUpdate.count !== 1) throw new TaskTransitionError();
    });
  } catch (error) {
    if (error instanceof TaskTransitionError) {
      return { error: "This task can no longer be completed." };
    }
    throw error;
  }

  revalidatePath("/employee");
  revalidatePath("/employee/my-tasks");
  revalidatePath("/employee/completed");
  revalidatePath(`/employee/my-tasks/${taskId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/service-requests");
  return {};
}
