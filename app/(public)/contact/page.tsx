import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Reach out when you need support." description="Our team is here to listen and help you understand the next steps." />
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-8">
            <h2 className="text-2xl font-semibold text-foreground">Contact details</h2>
            <dl className="mt-7 space-y-5 text-muted">
              <div><dt className="font-medium text-foreground">Phone</dt><dd className="mt-1">+94 00 000 0000</dd></div>
              <div><dt className="font-medium text-foreground">Email</dt><dd className="mt-1">support@example.com</dd></div>
              <div><dt className="font-medium text-foreground">Availability</dt><dd className="mt-1">Add your service hours here</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl bg-light-background p-8">
            <h2 className="text-2xl font-semibold text-foreground">Need immediate guidance?</h2>
            <p className="mt-4 leading-7 text-muted">Call the contact number above. Replace these placeholders with your organization’s verified details before publishing.</p>
          </div>
        </div>
      </section>
    </>
  );
}
