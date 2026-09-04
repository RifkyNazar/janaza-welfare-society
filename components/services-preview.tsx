"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type IconName = "hands" | "transport" | "heart" | "community";

type PreviewService = {
  title: string;
  description: string;
  icon: IconName;
};

// Temporary preview content: replace these entries when the final service list is ready.
const previewServices: PreviewService[] = [
  {
    title: "Janaza Assistance",
    description: "Guidance and support for Janaza arrangements.",
    icon: "hands",
  },
  {
    title: "Transport Support",
    description: "Support with required transport arrangements.",
    icon: "transport",
  },
  {
    title: "Family Support",
    description: "Practical assistance for families during difficult times.",
    icon: "heart",
  },
  {
    title: "Community Service",
    description: "Community-focused support and welfare activities.",
    icon: "community",
  },
];

function ServiceIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    hands: (
      <>
        <path d="M7 11.5V6.75a1.25 1.25 0 0 1 2.5 0V10" />
        <path d="M9.5 9V5.75a1.25 1.25 0 0 1 2.5 0V10" />
        <path d="M12 9V6.75a1.25 1.25 0 0 1 2.5 0v4" />
        <path d="M14.5 9.75a1.25 1.25 0 0 1 2.5 0v3.75c0 3.6-2.4 6-6 6h-.5c-2.1 0-3.25-1.2-4.1-2.5L4 13.5a1.4 1.4 0 0 1 2.1-1.8L8 13" />
      </>
    ),
    transport: (
      <>
        <path d="M4 15V8.5A2.5 2.5 0 0 1 6.5 6h7A2.5 2.5 0 0 1 16 8.5V15" />
        <path d="M16 10h1.5l2 3v2H4" />
        <path d="M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
        <path d="M4 10h12" />
      </>
    ),
    heart: (
      <path d="M20 8.5c0 5-8 10-8 10s-8-5-8-10A4.5 4.5 0 0 1 12 5.7a4.5 4.5 0 0 1 8 2.8Z" />
    ),
    community: (
      <>
        <circle cx="12" cy="8" r="3" />
        <circle cx="5.5" cy="10" r="2" />
        <circle cx="18.5" cy="10" r="2" />
        <path d="M7 19v-1.5a5 5 0 0 1 10 0V19M2.5 18v-1a3 3 0 0 1 4.5-2.6M21.5 18v-1a3 3 0 0 0-4.5-2.6" />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
      {paths[name]}
    </svg>
  );
}

export function ServicesPreview() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      section.classList.add("services-preview-visible");
      return;
    }

    section.classList.add("services-preview-ready");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("services-preview-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.16 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="services-preview-title" className="services-preview relative bg-light-background px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">Our Services</p>
          <h2 id="services-preview-title" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Support When Families Need It Most
          </h2>
          <div className="section-ornament" aria-hidden="true">
            <span />
          </div>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-muted">
            Essential Janaza and community services provided with care, dignity, and responsibility.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {previewServices.map((service) => (
            <div key={service.title} className="service-preview-card h-full">
              <article className="service-card-islamic group relative h-full overflow-hidden rounded-2xl border border-border bg-white p-7 shadow-[0_10px_30px_rgba(16,42,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_16px_40px_rgba(69,232,205,0.16)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
                <div className="service-icon-arch flex h-14 w-14 items-center justify-center bg-light-background text-foreground ring-1 ring-primary/40 transition duration-300 group-hover:scale-105 group-hover:shadow-[0_0_22px_rgba(69,232,205,0.35)]">
                  <ServiceIcon name={service.icon} />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">{service.title}</h3>
                <p className="mt-3 leading-7 text-muted">{service.description}</p>
              </article>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/services" className="group inline-flex items-center gap-2 rounded-full border border-primary bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition duration-300 hover:bg-light-background hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            View All Services
            <span className="cta-gem" aria-hidden="true" />
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
