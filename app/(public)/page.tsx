import { HomeHero } from "@/components/home-hero";
import { ServicesPreview } from "@/components/services-preview";
import { AboutPreview } from "@/components/about-preview";
import { OperationsPreview } from "@/components/operations-preview";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <ServicesPreview />
      <AboutPreview />
      <OperationsPreview />
    </>
  );
}
