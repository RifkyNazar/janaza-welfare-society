import { HomeHero } from "@/components/home-hero";
import { OperationsPreview } from "@/components/operations-preview";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <OperationsPreview />
    </>
  );
}
