import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isVehicleImageKey, readVehicleImage, vehicleImageMime } from "@/lib/vehicle-image-storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id.length > 191) return new Response(null, { status: 404 });

  const vehicle = await prisma.vehicle.findUnique({ where: { id }, select: { imageUrl: true, isActive: true, isPublic: true } });
  if (!vehicle?.imageUrl || !isVehicleImageKey(vehicle.imageUrl)) return new Response(null, { status: 404 });

  const session = await auth();
  const userId = Number(session?.user.id);
  const account = Number.isSafeInteger(userId) ? await prisma.user.findUnique({ where: { id: userId }, select: { role: true, status: true } }) : null;
  const manager = account?.status === "APPROVED" && (account.role === "ADMIN" || account.role === "SUPERVISOR");
  if (!manager && (!vehicle.isActive || !vehicle.isPublic)) return new Response(null, { status: 404 });

  const bytes = await readVehicleImage(vehicle.imageUrl);
  const mime = vehicleImageMime(vehicle.imageUrl);
  if (!bytes || !mime) return new Response(null, { status: 404 });
  return new Response(bytes, { headers: { "Content-Type": mime, "X-Content-Type-Options": "nosniff", "Cache-Control": manager ? "private, no-store" : "public, max-age=3600" } });
}
