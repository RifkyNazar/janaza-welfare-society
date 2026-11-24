import { liveAdvertisementFilter } from "@/lib/advertisement-schedule";
import { AdvertisementCarousel } from "@/components/advertisement-carousel";
import { AdvertisementRefresh } from "@/components/advertisement-refresh";
import { advertisementImageExists } from "@/lib/advertisement-image-storage";
import { prisma } from "@/lib/prisma";

export async function AdvertisementBanners() {
  const now = new Date();
  const [records, next] = await Promise.all([
    prisma.advertisement.findMany({
      where: liveAdvertisementFilter(now),
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, title: true, imageUrl: true, description: true, endsAt: true },
    }),
    prisma.advertisement.findFirst({
      where: { isActive: true, startsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
      select: { startsAt: true },
    }),
  ]);
  const checks = await Promise.all(records.map(({ imageUrl }) => advertisementImageExists(imageUrl)));
  const banners = records.filter((_, index) => checks[index]);
  const boundary = Math.min(next?.startsAt?.getTime() ?? Infinity, ...records.map(({ endsAt }) => endsAt ? endsAt.getTime() + 1 : Infinity));
  return <AdvertisementRefresh nextChange={Number.isFinite(boundary) ? boundary : null}><AdvertisementCarousel banners={banners} /></AdvertisementRefresh>;
}
