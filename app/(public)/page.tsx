import { HomeHero } from "@/components/home-hero";
import { OperationsPreview } from "@/components/operations-preview";
import { SupportPanel } from "@/components/support-panel";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <OperationsPreview />
      <SupportPanel />
    </>
  );
}
