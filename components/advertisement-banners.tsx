import { AdvertisementCarousel } from "@/components/advertisement-carousel";
import { advertisementImageExists } from "@/lib/advertisement-image-storage";
import { prisma } from "@/lib/prisma";

export async function AdvertisementBanners() {
  const now = new Date();
  const records = await prisma.advertisement.findMany({
    where: { isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, imageUrl: true, description: true },
  });
  const checks = await Promise.all(records.map((advertisement) => advertisementImageExists(advertisement.imageUrl)));
  const advertisements = records.filter((_, index) => checks[index]);
  if (!advertisements.length) return null;
  return <section aria-label="Community announcements" className="bg-white px-4 py-7 sm:px-8"><AdvertisementCarousel banners={advertisements}/></section>;
}
