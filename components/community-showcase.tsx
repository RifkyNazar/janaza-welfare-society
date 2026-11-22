import { prisma } from "@/lib/prisma";
import { vehicleImageSrc } from "@/lib/vehicle-image-storage";
import { CommunityShowcaseClient } from "@/components/community-showcase-client";
import { profilePhotoSrc } from "@/lib/profile-photo-storage";
export async function CommunityShowcase() {
    const employees = await prisma.employeeProfile.findMany({ where: { isPublicProfile: true, user: { role: "EMPLOYEE", status: "APPROVED" } }, orderBy: [{ fullName: "asc" }, { id: "asc" }], select: { fullName: true, position: true, photoUrl: true } });
    const vehicles = await prisma.vehicle.findMany({ where: { isActive: true, isPublic: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, imageUrl: true, vehicleType: true } });
    return <CommunityShowcaseClient publicTeam={employees.map(employee => ({ name: employee.fullName, position: employee.position, photo: profilePhotoSrc(employee.photoUrl) }))} vehicles={vehicles.map(v => ({ ...v, imageUrl: vehicleImageSrc(v.id, v.imageUrl) }))}/>;
}
