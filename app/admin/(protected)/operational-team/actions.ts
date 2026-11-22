"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { prepareMemberPhoto } from "@/lib/operational-member-photo";

export type MemberState = { error?: string; success?: string; fullName?: string };
const validId = (id: number) => Number.isSafeInteger(id) && id > 0;
const validVersion = (version: number | null) => version !== null && Number.isSafeInteger(version) && version >= 0;
function refresh(id?: number) {
  revalidatePath("/team");
  revalidatePath("/admin/operational-team");
  if (id) { revalidatePath(`/admin/operational-team/${id}`); revalidatePath(`/team-member-photos/${id}`); }
}

export async function saveOperationalMember(id: number | null, expectedVersion: number | null, _state: MemberState, form: FormData): Promise<MemberState> {
  await requireAdmin();
  if (id !== null && (!validId(id) || !validVersion(expectedVersion))) return { error: "Invalid member." };
  const entry = form.get("fullName");
  const fullName = typeof entry === "string" ? entry.trim() : "";
  if (!fullName || Array.from(fullName).length > 150) return { error: "Enter a full name of up to 150 characters.", fullName };
  const file = form.get("photo");
  const replacement = file instanceof File && file.size > 0;
  if (id === null && !replacement) return { error: "A member photo is required.", fullName };
  let photo: Uint8Array<ArrayBuffer> | undefined;
  if (replacement) {
    try { photo = await prepareMemberPhoto(file); }
    catch (error) { return { error: error instanceof Error ? error.message : "Choose a valid member photo.", fullName }; }
  }
  try {
    if (id === null) {
      await prisma.operationalTeamMember.create({ data: { fullName, photo: photo! }, select: { id: true } });
    } else {
      const result = await prisma.operationalTeamMember.updateMany({ where: { id, version: expectedVersion! }, data: { fullName, version: { increment: 1 }, ...(photo ? { photo } : {}) } });
      if (result.count !== 1) return { error: "This member changed or was deleted. Refresh before editing again.", fullName };
    }
  } catch {
    return { error: "Unable to save this member. Please try again.", fullName };
  }
  refresh(id ?? undefined);
  return { success: id === null ? "Member added." : "Member updated." };
}

export async function deleteOperationalMember(id: number, expectedVersion: number, _state: MemberState, form: FormData): Promise<MemberState> {
  await requireAdmin();
  if (!validId(id) || !validVersion(expectedVersion)) return { error: "Invalid member." };
  if (form.get("confirmation") !== "DELETE") return { error: "Confirm deletion before continuing." };
  try {
    const result = await prisma.operationalTeamMember.deleteMany({ where: { id, version: expectedVersion } });
    if (result.count !== 1) return { error: "This member changed or was deleted. Refresh before deleting again." };
  } catch { return { error: "Unable to delete this member. Please try again." }; }
  refresh(id);
  redirect("/admin/operational-team?deleted=1");
}
