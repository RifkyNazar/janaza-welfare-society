"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export type PhotoReviewState = { error?: string; success?: string };

export async function reviewTaskPhoto(photoId: number, approved: boolean, _state: PhotoReviewState, _formData: FormData): Promise<PhotoReviewState> {
  void _state;
  void _formData;
  const session = await requireAdmin();
  const adminId = Number(session.user.id);
  if (!Number.isSafeInteger(photoId) || photoId <= 0 || !Number.isSafeInteger(adminId) || adminId <= 0) return { error: "Invalid photo review request." };

  const photo = await prisma.taskPhoto.findUnique({ where: { id: photoId }, select: { taskAssignmentId: true } });
  if (!photo) return { error: "Task photo not found." };

  await prisma.taskPhoto.update({
    where: { id: photoId },
    data: { isApprovedForPublic: approved, reviewedAt: new Date(), reviewedByAdminId: adminId },
  });

  revalidatePath(`/admin/task-assignments/${photo.taskAssignmentId}`);
  revalidatePath(`/employee/my-tasks/${photo.taskAssignmentId}`);
  revalidatePath("/");
  revalidatePath("/operations");
  return { success: approved ? "Photo approved for public use." : "Public approval removed." };
}
