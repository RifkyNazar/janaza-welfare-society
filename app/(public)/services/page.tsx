import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { ServiceCard } from "@/components/service-card";

export const metadata: Metadata = { title: "Services" };

const services = [
  { title: "First Steps", description: "A clear overview of what to do immediately after a loved one passes away." },
  { title: "Ghusl Guidance", description: "Respectful information about preparation and washing according to Islamic practice." },
  { title: "Janaza Prayer", description: "Help understanding prayer arrangements, timing, and community coordination." },
  { title: "Burial Coordination", description: "Practical guidance for communicating with cemeteries and service providers." },
  { title: "Family Resources", description: "Helpful information for relatives, friends, and those supporting the bereaved." },
  { title: "Community Connections", description: "Direction toward relevant local services and trusted community contacts." },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero eyebrow="Services" title="Practical help, thoughtfully organized." description="Explore the areas where we can guide and support you through the janaza process." />
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => <ServiceCard key={service.title} {...service} />)}
        </div>
      </section>
    </>
  );
}
