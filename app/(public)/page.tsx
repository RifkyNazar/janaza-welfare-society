import { EmeraldSanctuary } from "@/components/emerald-sanctuary";
import { AdvertisementBanners } from "@/components/advertisement-banners";
import { HeroCarousel } from "@/components/hero-carousel";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Janaza Welfare Society | Kattankudy", description: "Compassionate Janaza assistance for families in Kattankudy. Request a service, track your request, and discover our community work." };

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [media, operationalMembers] = await Promise.all([prisma.heroMedia.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
    select: { id: true, altText: true, caption: true },
  }), prisma.operationalTeamMember.findMany({
    select: { id: true, fullName: true, version: true },
    orderBy: [{ fullName: "asc" }, { id: "asc" }],
  })]);
  const images = media.map(({ id, altText, caption }) => ({
    src: `/public-media/hero/${id}`,
    altText,
    caption,
  }));
  return <EmeraldSanctuary
    operationalMembers={operationalMembers}
    announcements={<AdvertisementBanners />}
    heroMedia={images.length ? <HeroCarousel images={images} /> : undefined}
  />;
}
