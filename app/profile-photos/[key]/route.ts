import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profilePhotoMime, readProfilePhoto } from "@/lib/profile-photo-storage";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const profile = await prisma.employeeProfile.findFirst({ where: { photoUrl: key }, select: { userId: true, isPublicProfile: true, user: { select: { role: true, status: true } } } });
  if (!profile) return new Response("Not found", { status: 404 });
  const session = await auth(); const requesterId = Number(session?.user.id);
  const account = Number.isSafeInteger(requesterId) && requesterId > 0 ? await prisma.user.findUnique({ where: { id: requesterId }, select: { role: true, status: true } }) : null;
  const allowed = (profile.isPublicProfile && profile.user.role === "EMPLOYEE" && profile.user.status === "APPROVED") || (account?.status === "APPROVED" && (account.role === "ADMIN" || requesterId === profile.userId));
  if (!allowed) return new Response("Not found", { status: 404 });
  const bytes = await readProfilePhoto(key); const mime = profilePhotoMime(key);
  if (!bytes || !mime) return new Response("Not found", { status: 404 });
  return new Response(bytes, { headers: { "Content-Type": mime, "Cache-Control": profile.isPublicProfile ? "public, max-age=3600" : "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
