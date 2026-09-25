"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";
import { MAX_TASK_PHOTO_CAPTION_LENGTH, removeStoredTaskPhoto, storeTaskPhoto, validateTaskPhoto } from "@/lib/task-photo-storage";

export type UploadTaskPhotoState = { error?: string; success?: string };

export async function uploadTaskPhoto(taskId: number, _state: UploadTaskPhotoState, formData: FormData): Promise<UploadTaskPhotoState> {
  void _state;
  const session = await requireEmployee();
  const profileId = session.user.employeeProfileId;
  if (!profileId || !Number.isSafeInteger(taskId) || taskId <= 0) return { error: "Invalid task." };

  const task = await prisma.taskAssignment.findFirst({
    where: { id: taskId, employeeId: profileId, OR: [{ isActive: true, status: { in: ["ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS"] } }, { status: "COMPLETED" }] },
    select: { id: true },
  });
  if (!task) return { error: "This task is not available for photo uploads." };

  const entry = formData.get("image");
  const captionEntry = formData.get("caption");
  const caption = typeof captionEntry === "string" ? captionEntry.trim() : "";
  if (!(entry instanceof File)) return { error: "Please choose an image." };
  const validationError = validateTaskPhoto(entry);
  if (validationError) return { error: validationError };
  if (caption.length > MAX_TASK_PHOTO_CAPTION_LENGTH) return { error: `Caption must be ${MAX_TASK_PHOTO_CAPTION_LENGTH} characters or fewer.` };

  let storageKey: string;
  try {
    storageKey = await storeTaskPhoto(entry);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_IMAGE_SIGNATURE") return { error: "The selected file is not a valid JPEG, PNG, or WEBP image." };
    return { error: "The image could not be stored. Please try again." };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.taskPhoto.create({
        data: { taskAssignmentId: task.id, imageUrl: storageKey, caption: caption || null },
      });
      await transaction.taskAssignment.update({
        where: { id: task.id },
        data: { photosSubmittedAt: null },
      });
    });
  } catch (error) {
    await removeStoredTaskPhoto(storageKey);
    throw error;
  }

  revalidatePath(`/employee/my-tasks/${taskId}`);
  revalidatePath(`/admin/task-assignments/${taskId}`);
  return { success: "Photo uploaded privately. Submit the photo set when it is ready for review." };
}

export async function submitPhotosForReview(taskId: number, _state: UploadTaskPhotoState, _formData: FormData): Promise<UploadTaskPhotoState> {
  void _state;
  void _formData;
  const session = await requireEmployee();
  const profileId = session.user.employeeProfileId;
  if (!profileId || !Number.isSafeInteger(taskId) || taskId <= 0) return { error: "Invalid task." };

  const result = await prisma.taskAssignment.updateMany({
    where: {
      id: taskId,
      employeeId: profileId,
      OR: [{ isActive: true, status: { in: ["ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS"] } }, { status: "COMPLETED" }],
      photosSubmittedAt: null,
      photos: { some: {} },
    },
    data: { photosSubmittedAt: new Date() },
  });
  if (result.count !== 1) return { error: "Photos are already submitted or this task is not available for review confirmation." };

  revalidatePath(`/employee/my-tasks/${taskId}`);
  revalidatePath(`/admin/task-assignments/${taskId}`);
  return { success: "Photos submitted for review." };
}
