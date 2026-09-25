import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { ProfileForm } from "@/components/employee/profile-form";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";
import { profilePhotoSrc } from "@/lib/profile-photo-storage";
import { updateOwnProfile } from "./actions";

export const metadata: Metadata = { title: "My Profile" };
export default async function EmployeeProfilePage() {
  const session = await requireEmployee(); const userId = Number(session.user.id);
  const employee = await prisma.user.findFirst({ where: { id: userId, role: "EMPLOYEE" }, select: { email: true, employeeProfile: { select: { fullName: true, employeeCode: true, phone: true, position: true, duty: true, photoUrl: true, isPublicProfile: true } } } });
  if (!employee?.employeeProfile) notFound(); const profile = employee.employeeProfile;
  const initials = profile.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <div className="mx-auto max-w-4xl"><BackButton fallbackHref="/employee" label="Back to Dashboard"/><div className="mt-6"><p className="text-sm font-semibold text-primary">Account</p><h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">My Profile</h1><p className="mt-2 text-sm text-muted">Update your contact details and profile photo. Account controls remain managed by JWS administrators.</p></div>
    <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-light-background p-5 text-sm sm:grid-cols-3"><p><span className="block text-xs font-semibold uppercase tracking-wider text-muted">Employee code</span><span className="mt-1 block font-semibold">{profile.employeeCode}</span></p><p><span className="block text-xs font-semibold uppercase tracking-wider text-muted">Position</span><span className="mt-1 block font-semibold">{profile.position}</span></p><p><span className="block text-xs font-semibold uppercase tracking-wider text-muted">Visibility</span><span className="mt-1 block font-semibold">{profile.isPublicProfile ? "Public profile enabled" : "Private profile"}</span></p></div>
    <ProfileForm action={updateOwnProfile} initial={{ fullName: profile.fullName, email: employee.email, phone: profile.phone, duty: profile.duty ?? "" }} photoSrc={profilePhotoSrc(profile.photoUrl)} initials={initials}/>
  </div>;
}
