import "server-only";
import { prisma } from "@/lib/prisma";
import { removeAdvertisementImage } from "@/lib/advertisement-image-storage";

export async function deleteAdvertisementRecord(id: string, expiredBefore?: Date) {
  return prisma.$transaction(async tx => {
    // Lock the owner and any other advertisements sharing the same key.
    const owners = await tx.$queryRaw<{ id: string; imageUrl: string; endsAt: Date | null }[]>`
      SELECT id, imageUrl, endsAt FROM Advertisement
      WHERE imageUrl = (SELECT imageUrl FROM Advertisement WHERE id = ${id})
      FOR UPDATE
    `;
    const current = owners.find(row => row.id === id);
    if (!current || (expiredBefore && (!current.endsAt || current.endsAt >= expiredBefore))) return false;
    await tx.advertisement.delete({ where: { id, imageUrl: current.imageUrl, ...(expiredBefore ? { endsAt: { lt: expiredBefore } } : {}) } });
    // Handle filesystem errors before commit so the scheduler can retry this record.
    if (owners.length === 1) await removeAdvertisementImage(current.imageUrl);
    return true;
  }, { isolationLevel: "ReadCommitted" });
}

export async function cleanupExpiredAdvertisements(now = new Date()) {
  const rows = await prisma.advertisement.findMany({
    where: { endsAt: { lt: now } },
    orderBy: [{ endsAt: "asc" }, { id: "asc" }],
    take: 200,
    select: { id: true },
  });
  let deleted = 0;
  let failed = 0;
  for (const { id } of rows) {
    try { if (await deleteAdvertisementRecord(id, now)) deleted++; }
    catch (error) { failed++; console.error("[advertisements] Cleanup failed", id, error instanceof Error ? error.name : "unknown error"); }
  }
  return { deleted, failed };
}
