"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const values = ["Community Focused", "Trusted Support", "Responsible Service"];

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
      <path d="m5 10 3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommunityPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center bg-[linear-gradient(145deg,#F4FFFC_0%,#FFFFFF_72%)] p-8 text-foreground">
      <div className="text-center">
        <svg aria-hidden="true" viewBox="0 0 160 130" fill="none" className="mx-auto w-40 text-primary sm:w-48">
          <circle cx="80" cy="62" r="54" fill="currentColor" fillOpacity=".1" />
          <path d="M39 103h82M49 103V65h62v38M59 65V49h42v16M70 49V35h20v14M60 79h12v24H60zm28 0h12v24H88z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M75 35a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em]">Community image</p>
        <p className="mt-2 text-sm text-muted">Official organization photo to be added</p>
      </div>
    </div>
  );
}

export function AboutPreview() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      section.classList.add("about-preview-visible");
      return;
    }

    section.classList.add("about-preview-ready");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("about-preview-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.18 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="about-preview-title" className="about-preview relative overflow-hidden bg-white px-6 py-20 sm:py-24">
      <div className="about-crescent" aria-hidden="true">
        <span />
      </div>
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
        <div className="about-preview-image relative mx-auto w-full max-w-2xl lg:mx-0">
          <span className="absolute -left-3 -top-3 -z-0 size-24 rounded-2xl bg-primary/20" aria-hidden="true" />
          <div className="relative aspect-[6/5] overflow-hidden rounded-[1.75rem] border border-border bg-light-background shadow-[0_18px_50px_rgba(16,42,42,0.08)]">
            <CommunityPlaceholder />
          </div>
          <span className="absolute -bottom-3 -right-3 size-16 rounded-full border-[10px] border-white bg-primary/35" aria-hidden="true" />
        </div>

        <div className="about-preview-copy max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">About Us</p>
          <h2 id="about-preview-title" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Serving the Community with Care and Responsibility
          </h2>
          <div className="section-ornament section-ornament-left" aria-hidden="true">
            <span />
          </div>
          <p className="mt-5 leading-7 text-muted">
            Janaza Welfare Society supports families and the community with dignity, respect, and responsible service.
          </p>

          <ul className="mt-7 space-y-4">
            {values.map((value) => (
              <li key={value} className="about-preview-value flex items-center gap-3 font-semibold text-foreground">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-foreground ring-1 ring-primary/50">
                  <CheckIcon />
                </span>
                {value}
              </li>
            ))}
          </ul>

          <Link href="/about" className="group mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-foreground transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(69,232,205,0.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none">
            Learn More
            <span className="cta-gem" aria-hidden="true" />
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
