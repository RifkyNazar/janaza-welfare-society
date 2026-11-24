import { liveAdvertisementFilter } from "@/lib/advertisement-schedule";
import { AdvertisementCarousel } from "@/components/advertisement-carousel";
import { advertisementImageExists } from "@/lib/advertisement-image-storage";
import { prisma } from "@/lib/prisma";

export async function AdvertisementBanners() {
  const now = new Date();
  const records = await prisma.advertisement.findMany({
    where: liveAdvertisementFilter(now),
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, imageUrl: true, description: true, endsAt: true },
  });
  const checks = await Promise.all(records.map(({ imageUrl }) => advertisementImageExists(imageUrl)));
  const banners = records.filter((_, index) => checks[index]);
  return <AdvertisementCarousel banners={banners.map(({ endsAt, ...banner }) => ({ ...banner, expiresAt: endsAt ? endsAt.getTime() + 1 : null }))} />;
}
