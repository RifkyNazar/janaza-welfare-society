import type { ReactNode } from "react";
import { BackButton } from "@/components/back-button";

type EmployeeAuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  wide?: boolean;
};

export function EmployeeAuthLayout({
  title,
  description,
  children,
  backHref,
  backLabel,
  wide = false,
}: EmployeeAuthLayoutProps) {
  return (
    <section className="employee-auth-surface relative isolate overflow-hidden px-6 py-16 sm:py-20 lg:py-24">
      <div className="employee-auth-pattern" aria-hidden="true" />
      <div className={`employee-auth-enter mx-auto ${wide ? "max-w-5xl" : "max-w-xl"}`}>
        <div className="text-center">
          <div className="employee-auth-arch mx-auto" aria-hidden="true">
            <span />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-muted">Janaza Welfare Society</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{title}</h1>
          <div className="section-ornament" aria-hidden="true"><span /></div>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">{description}</p>
        </div>

        <div className="mt-10">{children}</div>

        {backHref && backLabel && (
          <div className="mt-7 text-center">
            <BackButton fallbackHref={backHref} label={backLabel} />
          </div>
        )}
      </div>
    </section>
  );
}
