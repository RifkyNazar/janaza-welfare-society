import { HomeHero } from "@/components/home-hero";
import { ServicesPreview } from "@/components/services-preview";
import { AboutPreview } from "@/components/about-preview";
import { OperationsPreview } from "@/components/operations-preview";
import { TeamPreview } from "@/components/team-preview";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <ServicesPreview />
      <AboutPreview />
      <TeamPreview />
      <OperationsPreview />
    </>
  );
}
