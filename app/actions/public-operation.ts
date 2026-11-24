"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireEmployee } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { storePublicMedia, removePublicMedia } from "@/lib/public-media-storage";
import { operationFields, type OperationActionState } from "@/lib/operation-fields";

export async function addOperation(portal: "admin" | "employee", _state: OperationActionState, form: FormData): Promise<OperationActionState> {
  if (portal === "admin") await requireAdmin();
  else if (portal === "employee") await requireEmployee();
  else return { error: "Invalid portal." };

  const values = operationFields(form);
  const { title, description } = values;
  if (!title || title.length > 191 || description.length > 10000) return { error: "Check the heading and description.", values };
  const photo = form.get("photo");
  if (!(photo instanceof File) || !photo.size) return { error: "Choose a photo.", values };

  let key: string | undefined;
  try {
    key = await storePublicMedia("activity", photo);
    const now = new Date();
    await prisma.operation.create({
      data: {
        title, description: description || null, shortDescription: description.slice(0, 500), serviceType: "", area: "",
        source: "MANUAL", isPublished: true, publishedAt: now, operationDate: now,
        media: { create: { storageKey: key, isPublic: true, altText: "Operation photo" } },
      },
    });
  } catch (error) {
    if (key) await removePublicMedia("activity", key);
    console.error("[operations] Creation failed", error instanceof Error ? error.name : "unknown error");
    return { error: "Could not save the operation. Choose a valid JPEG, PNG or WebP photo up to 5 MB and try again.", values };
  }
  revalidatePath("/");
  revalidatePath("/operations");
  revalidatePath("/admin/operations");
  redirect(portal === "admin" ? "/admin/operations" : "/employee/operations?added=1");
}
