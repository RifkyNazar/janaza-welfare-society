import type { Metadata } from "next";
import { RequestTracker } from "@/components/request-tracker";

export const metadata: Metadata = {
  title: "Track Request | Janaza Welfare Society",
  description: "Check the current status of a Janaza Welfare Society service request.",
};

export default function TrackRequestPage() {
  return (
    <section className="request-service-surface relative isolate overflow-hidden px-5 py-12 sm:px-6 sm:py-16">
      <div className="request-service-pattern" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl">
        <div className="mx-auto mb-9 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Private and secure</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Track Your Request</h1>
          <div className="section-ornament" aria-hidden="true"><span /></div>
          <p className="mt-4 text-sm leading-6 text-muted sm:text-base">Enter your request code and the same mobile number used when submitting your request.</p>
        </div>
        <RequestTracker />
      </div>
    </section>
  );
}
