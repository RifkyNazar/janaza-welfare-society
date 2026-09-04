import Link from "next/link";

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4"><path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function HomeHero() {
  return (
    <section className="home-hero relative isolate overflow-hidden border-b border-border bg-white px-6 py-16 sm:py-20 lg:py-24">
      <div className="home-pattern absolute inset-0 -z-20" aria-hidden="true" />
      <div className="absolute -right-32 -top-36 -z-10 size-[34rem] rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted sm:text-sm">Janaza Welfare Society <span className="text-primary">&#8226;</span> Kattankudy</p>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-7xl">Together in Every <span className="relative whitespace-nowrap">Farewell<span className="absolute inset-x-0 -bottom-1 h-2 bg-primary/35" aria-hidden="true" /></span></h1>
          <p className="mt-7 text-xl font-semibold text-foreground sm:text-2xl">Serving with Care &amp; Respect</p>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted sm:text-lg">Compassionate Janaza assistance for families in Kattankudy, offered with dignity, practical care, and the support of our community.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/request-service" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-foreground shadow-[0_12px_30px_rgba(69,232,205,0.24)] transition-colors hover:bg-[#35d8bd] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">Request Janaza Service <ArrowIcon /></Link>
            <Link href="/track-request" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/60 bg-white px-7 py-3 font-semibold text-foreground transition-colors hover:border-primary hover:bg-light-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">Track Your Request <ArrowIcon /></Link>
          </div>
          <div className="mt-4">
            <Link href="/employee-access" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-white/80 px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-primary hover:bg-primary/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4 text-foreground">
                <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="M4.5 17v-1.5a5.5 5.5 0 0 1 11 0V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Employee Access
            </Link>
          </div>
          <p className="mt-7 flex items-center gap-3 text-sm font-semibold text-muted"><span className="inline-flex size-3 rounded-full border-2 border-white bg-primary shadow-sm ring-4 ring-primary/20" aria-hidden="true" />Serving the Kattankudy Community</p>
        </div>
        <div className="relative mx-auto w-full max-w-lg lg:mx-0" aria-label="Janaza Welfare Society community service">
          <div className="absolute -inset-6 rounded-[3rem] border border-primary/20" aria-hidden="true" />
          <div className="home-hero-visual relative aspect-[4/5] overflow-hidden rounded-t-[12rem] rounded-b-[2.5rem] border border-primary/30 bg-light-background shadow-[0_30px_80px_rgba(16,42,42,0.11)]">
            <div className="absolute inset-x-10 top-12 h-px bg-gradient-to-r from-transparent via-primary to-transparent" aria-hidden="true" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
              <div className="flex size-24 items-center justify-center rounded-t-full rounded-b-3xl border border-primary/50 bg-white shadow-[0_14px_40px_rgba(16,42,42,0.08)]" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" className="size-12 text-foreground"><path d="M17 50V28c0-8.3 6.7-15 15-15s15 6.7 15 15v22M10 50h44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M25 50V35h14v15M32 7V3m-5 6 5 4 5-4" stroke="#45E8CD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.25em] text-muted">Compassion in service</p>
              <p className="mt-3 max-w-xs text-2xl font-semibold leading-tight text-foreground">Dignity for every family. Care at every step.</p>
            </div>
            <span className="absolute -bottom-20 -left-16 size-64 rounded-full border-[3rem] border-primary/15" aria-hidden="true" />
            <span className="absolute -right-10 top-1/3 size-28 rotate-45 border border-primary/25" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
