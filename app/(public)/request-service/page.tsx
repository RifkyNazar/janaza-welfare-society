import type { Metadata } from "next";
import Link from "next/link";
import { ServiceRequestForm } from "@/components/service-request-form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Request Service | Janaza Welfare Society",
  description: "Prepare a service request for Janaza Welfare Society, Kattankudy.",
};
export const dynamic = "force-dynamic";

export default async function RequestServicePage() {
  const vehicles = await prisma.vehicle.findMany({ where: { isActive: true, isPublic: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, vehicleType: true } });
  return (
    <section className="request-service-surface relative isolate overflow-hidden px-5 py-12 sm:px-6 sm:py-16">
      <div className="request-service-pattern" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl">
        <div className="mx-auto mb-9 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">We are here to help</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Request a Service</h1>
          <div className="section-ornament" aria-hidden="true"><span /></div>
          <p className="mt-4 text-sm leading-6 text-muted sm:text-base">
            Share the details below so our team can understand the support you need.
          </p>
          <p className="mt-4 text-sm text-muted">Already submitted a request? <Link href="/track-request" className="font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:text-muted">Track Request</Link></p>
        </div>
        <ServiceRequestForm vehicles={vehicles} />
      </div>
    </section>
  );
}
