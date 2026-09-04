"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type Operation = {
  title: string;
  date: string;
  description: string;
  illustration: "community" | "janaza" | "welfare";
};

// Temporary, privacy-safe preview content. Replace these entries with approved client data later.
const operations: Operation[] = [
  {
    title: "Community Support Activity",
    date: "2026",
    description: "Support provided to families and the local community.",
    illustration: "community",
  },
  {
    title: "Janaza Service Operation",
    date: "2026",
    description: "Coordinated support for Janaza-related arrangements.",
    illustration: "janaza",
  },
  {
    title: "Welfare Activity",
    date: "2026",
    description: "Community welfare assistance carried out by the organization.",
    illustration: "welfare",
  },
];

function OperationPlaceholder({ type }: { type: Operation["illustration"] }) {
  const paths = {
    community: <path d="M34 82V48h52v34M46 48V35h28v13M44 63h12v19H44zm20 0h12v19H64zM25 82h70" />,
    janaza: <path d="M29 78h62M39 78V46h42v32M48 46V34h24v12M52 61h16M60 53v16" />,
    welfare: <path d="M60 78S31 63 31 43a15 15 0 0 1 29-6 15 15 0 0 1 29 6c0 20-29 35-29 35ZM45 84h30" />,
  };

  return (
    <div className="flex h-full items-center justify-center bg-[linear-gradient(145deg,#F4FFFC,#FFFFFF)]">
      <svg aria-hidden="true" viewBox="0 0 120 105" fill="none" className="w-28 text-primary sm:w-32">
        <path d="M60 10 73 28l22 3-14 17 3 22-24-9-24 9 3-22-14-17 22-3Z" fill="currentColor" fillOpacity=".07" />
        <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</g>
      </svg>
    </div>
  );
}

export function OperationsPreview() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      section.classList.add("operations-preview-visible");
      return;
    }

    section.classList.add("operations-preview-ready");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("operations-preview-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.14 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="operations-preview-title" className="operations-preview bg-light-background px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">Recent Operations</p>
          <h2 id="operations-preview-title" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Serving the Community Through Action
          </h2>
          <div className="section-ornament" aria-hidden="true"><span /></div>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-muted">
            Some of the recent activities and services carried out by Janaza Welfare Society.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {operations.map((operation) => (
            <div key={operation.title} className="operation-preview-card h-full">
              <article className="group h-full overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_30px_rgba(16,42,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_16px_40px_rgba(69,232,205,0.16)]">
                <div className="aspect-[16/9] overflow-hidden border-b border-border">
                  <OperationPlaceholder type={operation.illustration} />
                </div>
                <div className="relative p-6 pt-7">
                  <span className="operation-date-badge absolute -top-4 left-6 inline-flex min-h-8 items-center rounded-full border border-primary/45 bg-white px-3 text-xs font-semibold tracking-wide text-foreground shadow-sm">
                    {operation.date}
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">{operation.title}</h3>
                  <p className="mt-3 leading-7 text-muted">{operation.description}</p>
                  <Link href="/operations" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                    View Details
                    <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none">→</span>
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/operations" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_9px_25px_rgba(69,232,205,0.22)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:transform-none motion-reduce:transition-none">
            View All Operations
            <span className="cta-gem" aria-hidden="true" />
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
