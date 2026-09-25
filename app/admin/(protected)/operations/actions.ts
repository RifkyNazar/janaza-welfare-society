"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export type OperationFormStateValues = { title: string; shortDescription: string; description: string; serviceType: string; area: string; operationDate: string; photoIds: number[] };
export type OperationActionState = { error?: string; values?: OperationFormStateValues };
const limits = { title: 191, shortDescription: 500, description: 10000, serviceType: 191, area: 191 } as const;

function text(formData: FormData, name: string) {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry.trim() : "";
}

function values(formData: FormData) {
  const title = text(formData, "title");
  const shortDescription = text(formData, "shortDescription");
  const description = text(formData, "description");
  const serviceType = text(formData, "serviceType");
  const area = text(formData, "area");
  const operationDateInput = text(formData, "operationDate");
  const formValues = { title, shortDescription, description, serviceType, area, operationDate: operationDateInput, photoIds: photoIds(formData) };
  if (!title || !shortDescription || !serviceType || !area || !operationDateInput) return { error: "Please complete all required fields.", values: formValues } as const;
  if (title.length > limits.title || shortDescription.length > limits.shortDescription || description.length > limits.description || serviceType.length > limits.serviceType || area.length > limits.area) return { error: "One or more fields exceed the allowed length.", values: formValues } as const;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(operationDateInput)) return { error: "Please enter a valid operation date.", values: formValues } as const;
  const operationDate = new Date(`${operationDateInput}T00:00:00.000Z`);
  if (Number.isNaN(operationDate.getTime()) || operationDate.toISOString().slice(0, 10) !== operationDateInput) return { error: "Please enter a valid operation date.", values: formValues } as const;
  return { data: { title, shortDescription, description: description || null, serviceType, area, operationDate } } as const;
}

function photoIds(formData: FormData) {
  return [...new Set(formData.getAll("photoIds").map(Number).filter((id) => Number.isSafeInteger(id) && id > 0))];
}

export async function createOperation(taskId: number, _state: OperationActionState, formData: FormData): Promise<OperationActionState> {
  void _state;
  await requireAdmin();
  if (!Number.isSafeInteger(taskId) || taskId <= 0) return { error: "Invalid task assignment." };
  const parsed = values(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };
  const selectedIds = photoIds(formData);
  const preserved = { title: parsed.data.title, shortDescription: parsed.data.shortDescription, description: parsed.data.description ?? "", serviceType: parsed.data.serviceType, area: parsed.data.area, operationDate: text(formData, "operationDate"), photoIds: selectedIds };
  const task = await prisma.taskAssignment.findFirst({
    where: { id: taskId, status: "COMPLETED", request: { is: { status: "COMPLETED" } }, operation: null },
    select: { id: true, photos: { where: { id: { in: selectedIds }, isApprovedForPublic: true }, select: { id: true } } },
  });
  if (!task) return { error: "This task is not eligible for a public operation.", values: preserved };
  if (task.photos.length !== selectedIds.length) return { error: "One or more selected photos are no longer approved for public use.", values: preserved };

  const operation = await prisma.$transaction(async (transaction) => {
    const created = await transaction.operation.create({ data: { taskAssignmentId: task.id, ...parsed.data, isPublished: false } });
    if (selectedIds.length) await transaction.operationPhoto.createMany({ data: selectedIds.map((taskPhotoId, displayOrder) => ({ operationId: created.id, taskPhotoId, displayOrder })) });
    return created;
  });
  revalidatePath("/admin/operations");
  revalidatePath(`/admin/task-assignments/${taskId}`);
  redirect(`/admin/operations/${operation.id}`);
}

export async function updateOperation(operationId: number, _state: OperationActionState, formData: FormData): Promise<OperationActionState> {
  void _state;
  await requireAdmin();
  if (!Number.isSafeInteger(operationId) || operationId <= 0) return { error: "Invalid operation." };
  const parsed = values(formData);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };
  const selectedIds = photoIds(formData);
  const preserved = { title: parsed.data.title, shortDescription: parsed.data.shortDescription, description: parsed.data.description ?? "", serviceType: parsed.data.serviceType, area: parsed.data.area, operationDate: text(formData, "operationDate"), photoIds: selectedIds };
  const operation = await prisma.operation.findUnique({ where: { id: operationId }, select: { taskAssignmentId: true } });
  if (!operation) return { error: "Operation not found.", values: preserved };
  const allowed = operation.taskAssignmentId ? await prisma.taskPhoto.findMany({ where: { taskAssignmentId: operation.taskAssignmentId, id: { in: selectedIds }, isApprovedForPublic: true }, select: { id: true } }) : [];
  if (allowed.length !== selectedIds.length) return { error: "One or more selected photos are no longer approved for public use.", values: preserved };
  await prisma.$transaction(async (transaction) => {
    await transaction.operation.update({ where: { id: operationId }, data: parsed.data });
    await transaction.operationPhoto.deleteMany({ where: { operationId } });
    if (selectedIds.length) await transaction.operationPhoto.createMany({ data: selectedIds.map((taskPhotoId, displayOrder) => ({ operationId, taskPhotoId, displayOrder })) });
  });
  revalidateOperationPaths(operationId);
  return {};
}

export async function setOperationPublished(operationId: number, publish: boolean, _state: OperationActionState, _formData: FormData): Promise<OperationActionState> {
  void _state; void _formData;
  await requireAdmin();
  if (!Number.isSafeInteger(operationId) || operationId <= 0) return { error: "Invalid operation." };
  const operation = await prisma.operation.findUnique({
    where: { id: operationId },
    select: { title: true, shortDescription: true, serviceType: true, area: true, operationDate: true, photos: { select: { taskPhoto: { select: { isApprovedForPublic: true } } } } },
  });
  if (!operation) return { error: "Operation not found." };
  if (publish && (!operation.title.trim() || !operation.shortDescription.trim() || !operation.serviceType.trim() || !operation.area.trim() || !operation.operationDate)) return { error: "Complete all required public fields before publishing." };
  if (publish && operation.photos.some(({ taskPhoto }) => !taskPhoto.isApprovedForPublic)) return { error: "Remove or re-approve unapproved selected photos before publishing." };
  await prisma.operation.update({ where: { id: operationId }, data: { isPublished: publish, publishedAt: publish ? new Date() : null } });
  revalidateOperationPaths(operationId);
  return {};
}

function revalidateOperationPaths(operationId: number) {
  revalidatePath("/");
  revalidatePath("/operations");
  revalidatePath(`/operations/${operationId}`);
  revalidatePath("/admin/operations");
  revalidatePath(`/admin/operations/${operationId}`);
}
