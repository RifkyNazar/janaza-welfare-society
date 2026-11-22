import { T } from "@/components/public-language";
import Link from "next/link";
import { HeroCarousel } from "@/components/hero-carousel";
import { prisma } from "@/lib/prisma";

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4"><path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export async function HomeHero() {
  const media = await prisma.heroMedia.findMany({ where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { id: "asc" }], select: { id: true, altText: true, caption: true } });
  return (
    <section className="home-hero premium-hero relative isolate overflow-hidden border-b border-border bg-white px-6 py-16 sm:py-20 lg:py-24">
      <div className="home-pattern absolute inset-0 -z-20" aria-hidden="true" />
      <div className="absolute -right-32 -top-36 -z-10 size-[34rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 sm:gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div className="max-w-3xl">
          <p className="hero-brand text-xs font-semibold uppercase tracking-[0.2em] text-muted sm:text-sm"><T text="Janaza Welfare Society" /> <span className="text-primary">&#8226;</span> <T text="Kattankudy" /></p>
          <h1 className="mt-6 hero-headline text-4xl font-semibold leading-[1.1] tracking-[-0.045em] text-foreground sm:text-6xl sm:leading-[1.02] lg:text-7xl"><T text="Together in Every" /> <span className="relative whitespace-nowrap"><T text="Farewell" /><span className="absolute inset-x-0 -bottom-1 h-2 bg-primary/35" aria-hidden="true" /></span></h1>
          <p className="hero-support mt-7 text-xl font-semibold text-foreground sm:text-2xl"><T text="Serving with Care & Respect" /></p>
          <p className="hero-support mt-4 max-w-2xl text-base leading-8 text-muted sm:text-lg"><T text="Compassionate Janaza assistance for families in Kattankudy, offered with dignity, practical care, and the support of our community." /></p>
          <div className="hero-buttons mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/request-service" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-foreground shadow-[0_12px_30px_rgba(8,127,35,0.24)] transition-colors hover:bg-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"><T text="Request Janaza Service" /> <ArrowIcon /></Link>
            <Link href="/track-request" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/60 bg-white px-7 py-3 font-semibold text-foreground transition-colors hover:border-primary hover:bg-light-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"><T text="Track Your Request" /> <ArrowIcon /></Link>
          </div>
          <div className="mt-4">
            <Link href="/employee-access" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-white/80 px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-primary hover:bg-primary/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4 text-foreground">
                <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="M4.5 17v-1.5a5.5 5.5 0 0 1 11 0V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <T text="Employee Access" />
            </Link>
          </div>
          <p className="mt-7 flex items-center gap-3 text-sm font-semibold text-muted"><span className="inline-flex size-3 rounded-full border-2 border-white bg-primary shadow-sm ring-4 ring-primary/20" aria-hidden="true" /><T text="Serving the Kattankudy Community" /></p>
        </div>
        <div className="relative mx-auto w-full max-w-2xl lg:mx-0" aria-label="Janaza Welfare Society community service vehicles">
          <div className="absolute -inset-4 rounded-[2rem] border border-primary/20" aria-hidden="true" />
          <HeroCarousel images={media.map(image => ({ src: `/public-media/hero/${image.id}`, altText: image.altText, caption: image.caption }))} />
          <div className="hero-caption glass-panel relative mx-4 -mt-8 flex items-center justify-between gap-3 rounded-2xl p-5"><div><p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted"><T text="Rooted in Kattankudy" /></p><p className="mt-1 text-sm font-semibold"><T text="Care that brings us together." /></p></div><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary">&#8599;</span></div>
        </div>
      </div>
    </section>
  );
}
