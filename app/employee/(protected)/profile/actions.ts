"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";
import { removeProfilePhoto, storeProfilePhoto, validateProfilePhoto } from "@/lib/profile-photo-storage";
import { normalizeEmployeePhone, PIN_ONLY_EMAIL_SUFFIX } from "@/lib/employee-phone";
import { assertEmployeePhonesAvailable, EmployeePhoneConflict, employeePhoneTransaction, lockEmployeePhoneAccount } from "@/lib/employee-phone-registration";

export type ProfileValues = { fullName: string; email: string; phone: string; duty: string };
export type ProfileActionState = { error?: string; success?: string; values?: ProfileValues };
const text = (data: FormData, name: string) => { const v = data.get(name); return typeof v === "string" ? v.trim() : ""; };
export async function updateOwnProfile(_state: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const session = await requireEmployee(); const userId = Number(session.user.id);
  const values = { fullName: text(formData, "fullName"), email: text(formData, "email").toLowerCase(), phone: text(formData, "phone"), duty: text(formData, "duty") };
  if (!values.fullName || !values.phone) return { error: "Complete your name and contact phone number.", values };
  if (values.fullName.length > 150 || values.email.length > 191 || values.phone.length > 30 || values.duty.length > 191) return { error: "One or more fields exceed the allowed length.", values };
  if (values.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.endsWith(PIN_ONLY_EMAIL_SUFFIX))) return { error: "Enter a valid email address.", values };
  if (!/^[+]?[0-9][0-9\s-]{7,20}$/.test(values.phone)) return { error: "Enter a valid phone number.", values };
  const photo = formData.get("photo"); if (photo instanceof File && photo.size) { const error = validateProfilePhoto(photo); if (error) return { error, values }; }
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { employeeProfile: { select: { id: true, photoUrl: true, fullName: true, phone: true, duty: true, updatedAt: true } } } });
  const profile = current?.employeeProfile;
  if (!profile) return { error: "Employee profile not found.", values };
  let newKey: string | null = null;
  if (photo instanceof File && photo.size) { try { newKey = await storeProfilePhoto(photo); } catch (error) { return { error: error instanceof Error && error.message === "INVALID_IMAGE_SIGNATURE" ? "The selected file is not a valid JPEG, PNG, or WEBP image." : "The photo could not be stored. Please try again.", values }; } }
  const duty = values.duty || null;
  const changedPublicDetails = newKey || values.fullName !== profile.fullName || duty !== profile.duty;
  try {
    await employeePhoneTransaction(async tx => {
      await lockEmployeePhoneAccount(tx, userId);
      await tx.user.update({ where: { id: userId, status: "APPROVED", role: "EMPLOYEE" }, data: { email: values.email || undefined } });
      const phone = normalizeEmployeePhone(values.phone);
      if (phone && phone !== normalizeEmployeePhone(profile.phone)) {
        await assertEmployeePhonesAvailable(tx, [phone], userId);
      }
      await tx.employeeProfile.update({
        where: { id: profile.id, updatedAt: profile.updatedAt },
        data: {
          fullName: values.fullName,
          phone: values.phone,
          duty,
          updatedAt: new Date(Math.max(Date.now(), profile.updatedAt.getTime() + 1)),
          ...(changedPublicDetails ? { isPublicProfile: false } : {}),
          ...(newKey ? { photoUrl: newKey } : {}),
        },
      });
    });
  }
  catch (error) {
    await removeProfilePhoto(newKey);
    if (error instanceof EmployeePhoneConflict) return { error: "Unable to use this phone number. Check the number or contact JWS for help.", values };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "That email address is already in use.", values };
    return { error: "Unable to save your profile right now.", values };
  }
  if (newKey) await removeProfilePhoto(profile.photoUrl);
  revalidatePath("/employee/profile"); revalidatePath("/team"); revalidatePath("/");
  revalidatePath("/admin/employees/phone-conflicts");
  return { success: "Profile saved.", values };
}
