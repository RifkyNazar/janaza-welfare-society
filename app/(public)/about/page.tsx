import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About us" title="Care rooted in faith, dignity, and community." description="We help families understand the janaza process and find calm, practical support when it matters most." />
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">Our purpose is simple: make a difficult process feel less overwhelming.</h2>
          <div className="space-y-5 leading-7 text-muted">
            <p>Janaza Care is a public information and support service designed around clarity, compassion, and respect for Islamic practice.</p>
            <p>We work to connect families with the guidance they need while keeping every interaction considerate and straightforward.</p>
          </div>
        </div>
      </section>
    </>
  );
}
