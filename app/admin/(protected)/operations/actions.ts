"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { operationFields, type OperationActionState } from "@/lib/operation-fields";
import { removePublicMedia, storePublicMedia } from "@/lib/public-media-storage";

function refresh(id: number) {
  revalidatePath("/");
  revalidatePath("/operations");
  revalidatePath(`/operations/${id}`);
  revalidatePath("/admin/operations");
  revalidatePath(`/admin/operations/${id}`);
  revalidatePath("/admin/task-assignments", "layout");
}

export async function updateOperation(id: number, _state: OperationActionState, form: FormData): Promise<OperationActionState> {
  await requireAdmin();
  if (!Number.isSafeInteger(id) || id < 1) return { error: "Invalid operation." };
  const values = operationFields(form);
  if (!values.title || values.title.length > 191 || values.description.length > 10000) return { error: "Check the heading and description.", values };
  const { title, description } = values;
  const entry = form.get("photo");
  const replacement = entry instanceof File && entry.size > 0;
  const fields = { title, description: description || null, shortDescription: description.slice(0, 500) };
  if (replacement) {
    const operation = await prisma.operation.findFirst({
      where: { id, source: "MANUAL", taskAssignmentId: null },
      select: { updatedAt: true, media: { where: { isPublic: true }, orderBy: [{ displayOrder: "asc" }, { id: "asc" }], take: 1, select: { id: true, storageKey: true, altText: true, caption: true, displayOrder: true } } },
    });
    if (!operation) return { error: "This operation cannot use an uploaded replacement photo.", values };
    let key: string | undefined;
    const previous = operation.media[0];
    try {
      const storageKey = await storePublicMedia("activity", entry);
      key = storageKey;
      await prisma.operation.update({
        where: { id, updatedAt: operation.updatedAt },
        data: { ...fields, media: previous
          ? { delete: { id: previous.id, storageKey: previous.storageKey }, create: { storageKey, isPublic: true, altText: previous.altText, caption: previous.caption, displayOrder: previous.displayOrder } }
          : { create: { storageKey, isPublic: true, altText: "Operation photo" } },
        },
      });
    } catch {
      if (key) await removePublicMedia("activity", key);
      return { error: "Could not replace the photo. Check the image or whether the operation has changed.", values };
    }
    if (previous) await removePublicMedia("activity", previous.storageKey);
  } else {
    const result = await prisma.operation.updateMany({ where: { id }, data: fields });
    if (!result.count) return { error: "Operation not found." };
  }
  refresh(id);
  return { success: "Operation updated." };
}

export async function deleteOperation(id: number, _state: OperationActionState, _form: FormData): Promise<OperationActionState> {
  void _form;
  await requireAdmin();
  if (!Number.isSafeInteger(id) || id < 1) return { error: "Invalid operation." };
  let media;
  try {
    media = await prisma.$transaction(async tx => {
      const current = await tx.operation.findUnique({ where: { id }, select: { updatedAt: true, media: { select: { storageKey: true } } } });
      if (!current) return null;
      await tx.operation.delete({ where: { id, updatedAt: current.updatedAt } });
      return current.media;
    });
  } catch {
    return { error: "Could not delete the operation. Check whether it has changed and try again." };
  }
  if (!media) return { error: "Operation not found." };
  await Promise.all(media.map(({ storageKey }) => removePublicMedia("activity", storageKey)));
  refresh(id);
  redirect("/admin/operations");
}
