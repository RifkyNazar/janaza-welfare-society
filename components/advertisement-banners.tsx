import { liveAdvertisementFilter } from "@/lib/advertisement-schedule";
import { getPortalTranslation } from "@/lib/portal-language";
import { AdvertisementCarousel } from "@/components/advertisement-carousel";
import { advertisementImageExists } from "@/lib/advertisement-image-storage";
import { prisma } from "@/lib/prisma";

export async function AdvertisementBanners() {
  const now = new Date();
  const records = await prisma.advertisement.findMany({
    where: liveAdvertisementFilter(now),
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, imageUrl: true, description: true },
  });
  const checks = await Promise.all(records.map((advertisement) => advertisementImageExists(advertisement.imageUrl)));
  const advertisements = records.filter((_, index) => checks[index]);
  if (!advertisements.length) return null;
  const { t } = await getPortalTranslation();
  return <section aria-label={t("Community notices")} className="bg-white px-4 py-7 sm:px-8"><AdvertisementCarousel banners={advertisements}/></section>;
}
