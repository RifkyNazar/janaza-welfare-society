import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readStoredTaskPhoto, taskPhotoMime } from "@/lib/task-photo-storage";

function validId(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const accountId = Number(session?.user.id);
  const photoId = validId((await params).id);
  if (!session || !Number.isSafeInteger(accountId) || accountId <= 0 || !photoId) return new Response(null, { status: 404 });

  const account = await prisma.user.findUnique({
    where: { id: accountId },
    select: { role: true, status: true, employeeProfile: { select: { id: true } } },
  });
  if (!account || account.status !== "APPROVED") return new Response(null, { status: 404 });

  const photo = await prisma.taskPhoto.findFirst({
    where: {
      id: photoId,
      ...(account.role === "ADMIN" ? {} : account.role === "EMPLOYEE" && account.employeeProfile ? { taskAssignment: { is: { employeeId: account.employeeProfile.id } } } : { id: -1 }),
    },
    select: { imageUrl: true },
  });
  if (!photo) return new Response(null, { status: 404 });

  const mime = taskPhotoMime(photo.imageUrl);
  const bytes = mime ? await readStoredTaskPhoto(photo.imageUrl) : null;
  if (!mime || !bytes) return new Response(null, { status: 404 });

  return new Response(bytes, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
