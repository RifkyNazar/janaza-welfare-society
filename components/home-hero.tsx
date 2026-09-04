import Image from "next/image";
import Link from "next/link";
import profilrImage from "./images/img1.jpeg";

const heroAssets: { photo: string | null; watermark: string | null } = {
  // Add the official files to /public, then set their local paths here.
  photo: null,
  watermark: null,
};

const values = [
  { label: "Community First", icon: "community" },
  { label: "Dignity & Respect", icon: "dignity" },
  { label: "Trust & Responsibility", icon: "trust" },
  { label: "Support in Need", icon: "support" },
] as const;

const quickLinks = [
  { href: "/team", label: "Team Members" },
  { href: "/operations", label: "Operations" },
  { href: "/gallery", label: "Gallery" },
] as const;

function ValueIcon({ icon }: { icon: (typeof values)[number]["icon"] }) {
  const paths = {
    community: <path d="M4 17v-1.5A3.5 3.5 0 0 1 7.5 12h1A3.5 3.5 0 0 1 12 15.5V17M8 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5-1a2.5 2.5 0 0 1 3 2.45v.55m-1-7a2.5 2.5 0 0 1 0 5" />,
    dignity: <path d="M10 18s7-3.7 7-9.5A3.5 3.5 0 0 0 10 8a3.5 3.5 0 0 0-7 .5C3 14.3 10 18 10 18Z" />,
    trust: <path d="M10 2.5 16 5v4.5c0 3.8-2.45 6.75-6 8-3.55-1.25-6-4.2-6-8V5l6-2.5Zm-3 7 2 2 4-4" />,
    support: <path d="M3 10.5h3l2-4 3.5 7 2-3H17M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />,
  };

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-5">
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {paths[icon]}
      </g>
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeHero() {
  return (
    <section className="home-hero-surface relative isolate overflow-hidden bg-white pb-28 pt-14 text-foreground sm:pb-32 sm:pt-20 lg:min-h-[45rem] lg:pb-36 lg:pt-24">
      <svg className="hero-geometric-pattern" viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id="eight-point-pattern" width="84" height="84" patternUnits="userSpaceOnUse">
            <path d="m42 8 10 24 24 10-24 10-10 24-10-24L8 42l24-10Z" />
            <path d="M18 18h48v48H18z" transform="rotate(45 42 42)" />
          </pattern>
          <linearGradient id="pattern-fade" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="white" />
            <stop offset=".42" stopColor="black" />
            <stop offset=".72" stopColor="black" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
          <mask id="corner-mask"><rect width="1440" height="720" fill="url(#pattern-fade)" /></mask>
        </defs>
        <rect width="1440" height="720" fill="url(#eight-point-pattern)" mask="url(#corner-mask)" />
      </svg>
      {heroAssets.watermark && (
        <div className="absolute right-[2%] top-[8%] -z-10 aspect-squaimre w-[48vw] max-w-2xl opacity-[0.04]" aria-hidden="true">
          <Image src={heroAssets.watermark} alt="" fill sizes="48vw" className="object-contain" />
        </div>
      )}

      <span className="home-hero-leaf home-hero-leaf-one" aria-hidden="true" />
      <span className="home-hero-leaf home-hero-leaf-two" aria-hidden="true" />
      <span className="home-hero-leaf home-hero-leaf-three" aria-hidden="true" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
        <div className="home-hero-copy max-w-2xl">
          <p className="home-hero-reveal inline-flex rounded-full border border-primary/30 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted backdrop-blur-sm sm:text-sm">
            Serving with Care &amp; Respect
          </p>

          <h1 className="home-hero-reveal mt-6 text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
            Together in Every <span className="text-primary">Farewell</span>
          </h1>
          <div className="section-ornament section-ornament-left home-hero-reveal" aria-hidden="true"><span /></div>

          <ul className="mt-8 grid max-w-xl gap-x-6 gap-y-4 sm:grid-cols-2">
            {values.map((value, index) => (
              <li key={value.label} className="home-hero-value flex items-center gap-3" style={{ animationDelay: `${180 + index * 80}ms` }}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/35 bg-white text-foreground shadow-[0_0_22px_rgba(69,232,205,0.2)]">
                  <ValueIcon icon={value.icon} />
                </span>
                <span className="text-sm font-semibold text-foreground">{value.label}</span>
              </li>
            ))}
          </ul>

          <div className="home-hero-actions mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/request-service" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-foreground transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(69,232,205,0.32)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none">
              Request Service
              <span className="cta-gem" aria-hidden="true" />
              <ArrowIcon />
            </Link>
            <Link href="/employee-access" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/50 bg-white px-7 py-3 font-semibold text-foreground transition duration-300 ease-out hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_25px_rgba(16,42,42,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none motion-reduce:transition-none">
              Employee Access
              <span className="cta-gem" aria-hidden="true" />
              <ArrowIcon />
            </Link>
          </div>

          <div className="home-hero-actions mt-4 flex flex-wrap gap-2.5" style={{ animationDelay: "580ms" }} aria-label="Quick links">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_7px_20px_rgba(69,232,205,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none motion-reduce:transition-none"
              >
                {link.label}
                <span aria-hidden="true" className="text-primary transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none">→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="home-hero-image home-hero-arch relative isolate mx-auto w-full max-w-xl lg:mx-0">
          <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-primary/10 blur-2xl" aria-hidden="true" />
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-white/80 bg-light-background shadow-[0_24px_70px_rgba(16,42,42,0.10)]">
          <>
                        <Image src={profilrImage} alt="Janaza Welfare Society serving the Kattankudy community" fill priority sizes="(min-width: 1024px) 46vw, 100vw" className="object-cover" />
          </>
            
            
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-28" aria-hidden="true">
        <svg className="absolute inset-0 size-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0 54C250 108 445 2 715 49c281 49 455 15 725-23v94H0Z" fill="#45E8CD" fillOpacity="0.18" />
          <path d="M0 78c275 30 452-42 735-6 260 33 465 5 705-19v67H0Z" fill="#F4FFFC" />
          <path d="M0 94c306 15 492-20 746 1 280 24 493-3 694-12v37H0Z" fill="#FFFFFF" />
        </svg>
        <span className="absolute bottom-4 left-1/2 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border border-primary/40 bg-white text-foreground shadow-[0_8px_24px_rgba(16,42,42,0.08)]">
          <svg viewBox="0 0 20 20" fill="none" className="size-4">
            <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </section>
  );
}
