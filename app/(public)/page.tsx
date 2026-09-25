import { HomeHero } from "@/components/home-hero";
import { OperationsPreview } from "@/components/operations-preview";
import { SupportPanel } from "@/components/support-panel";
import { AboutSnapshot } from "@/components/about-snapshot";
import { AdvertisementBanners } from "@/components/advertisement-banners";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <AdvertisementBanners />
      <OperationsPreview />
      <SupportPanel />
      <AboutSnapshot />
    </>
  );
}
