import type { Metadata } from "next";
import Image from "next/image";
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
      <section aria-labelledby="our-team-photo" className="bg-light-background px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Our Team</p><h2 id="our-team-photo" className="mt-3 text-3xl font-semibold tracking-tight">Serving together for the community.</h2><p className="mt-4 leading-7 text-muted">JWS brings together committed community members to support welfare initiatives with care and responsibility.</p></div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-border bg-white shadow-[0_14px_40px_rgba(16,42,42,0.08)]"><Image src="/images/jws/team/group.jpeg" alt="Janaza Welfare Society team" fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-contain" /></div>
        </div>
      </section>
      <section aria-labelledby="community-recognition" className="bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Community Recognition</p><h2 id="community-recognition" className="mt-3 text-3xl font-semibold tracking-tight">Serving beyond immediate assistance.</h2><p className="mt-4 leading-7 text-muted">Moments from JWS community involvement and recognition.</p></div><div className="mt-8 grid items-start gap-4 sm:grid-cols-3">{[{ name: "operation-01.jpeg", ratio: "aspect-[3/2]" }, { name: "operation-02.jpeg", ratio: "aspect-[2/3]" }, { name: "operation-03.jpeg", ratio: "aspect-[2/3]" }].map((image) => <div key={image.name} className={`relative ${image.ratio} overflow-hidden rounded-2xl border border-border bg-light-background`}><Image src={`/images/jws/operations/${image.name}`} alt="JWS community recognition event" fill sizes="(min-width: 640px) 33vw, 100vw" className="object-contain" /></div>)}</div></div>
      </section>
    </>
  );
}
