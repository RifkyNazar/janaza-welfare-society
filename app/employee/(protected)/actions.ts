"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";

export type TaskActionState = { error?: string };

class TaskUnavailableError extends Error {}
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
  const profileId = await employeeProfileId();

  if (!profileId) return { error: "An employee profile is required to accept tasks." };
  if (!validId(requestId)) return { error: "Invalid service request." };

  try {
    await prisma.$transaction(async (transaction) => {
      const updated = await transaction.serviceRequest.updateMany({
        where: { id: requestId, status: "NEW", taskAssignment: null },
        data: { status: "ASSIGNED" },
      });

      if (updated.count !== 1) throw new TaskUnavailableError();

      await transaction.taskAssignment.create({
        data: {
          requestId,
          employeeId: profileId,
          status: "ASSIGNED",
          acceptedAt: new Date(),
        },
      });
    });
  } catch (error) {
    if (
      error instanceof TaskUnavailableError ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
    ) {
      return { error: "This request is no longer available." };
    }
    throw error;
  }

  revalidatePath("/employee");
  revalidatePath("/employee/tasks");
  revalidatePath("/employee/my-tasks");
  revalidatePath("/admin");
  revalidatePath("/admin/service-requests");
  redirect("/employee/my-tasks");
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
        where: { id: taskId, employeeId: profileId },
        select: { requestId: true, status: true },
      });
      if (!task || task.status !== "ASSIGNED") throw new TaskTransitionError();

      const requestUpdate = await transaction.serviceRequest.updateMany({
        where: { id: task.requestId, status: "ASSIGNED" },
        data: { status: "IN_PROGRESS" },
      });
      const taskUpdate = await transaction.taskAssignment.updateMany({
        where: { id: taskId, employeeId: profileId, status: "ASSIGNED" },
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
        where: { id: taskId, employeeId: profileId },
        select: { requestId: true, status: true },
      });
      if (!task || task.status !== "IN_PROGRESS") throw new TaskTransitionError();

      const completedAt = new Date();
      const requestUpdate = await transaction.serviceRequest.updateMany({
        where: { id: task.requestId, status: "IN_PROGRESS" },
        data: { status: "COMPLETED" },
      });
      const taskUpdate = await transaction.taskAssignment.updateMany({
        where: { id: taskId, employeeId: profileId, status: "IN_PROGRESS" },
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
