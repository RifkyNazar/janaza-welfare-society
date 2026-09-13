"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = () => setIsMenuOpen(false);

  if (pathname === "/") {
    return (
      <header className="relative z-30 border-b border-border bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-6">
          <Link href="/" className="min-w-0 leading-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            <span className="block truncate text-lg font-semibold tracking-tight sm:text-xl">Janaza Welfare Society</span>
            <span className="mt-1 block text-xs font-medium tracking-wide text-muted">Kattankudy</span>
          </Link>
          <Link href="/admin/login" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-primary/60 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Admin Login</Link>
        </div>
      </header>
    );
  }

  return (
    <header className="relative z-30 border-b border-border bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex min-h-20 items-center justify-between gap-6">
          <Link href="/" className="shrink-0 leading-tight text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" onClick={closeMenu}>
            <span className="block text-lg font-semibold tracking-tight sm:text-xl">Janaza Welfare Society</span>
            <span className="mt-1 block text-xs font-medium tracking-wide text-muted">Kattankudy</span>
          </Link>

          <div className="hidden items-center gap-4 xl:flex">
            <nav aria-label="Main navigation"><ul className="flex items-center gap-5 text-sm font-medium text-muted">{navigation.map((item) => <li key={item.href}><Link className="py-2 transition-colors hover:text-foreground focus-visible:text-primary focus-visible:outline-none" href={item.href}>{item.label}</Link></li>)}</ul></nav>
            <span className="border-l border-border pl-4 text-xs font-semibold text-foreground">{"\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD"} <span className="text-muted">|</span> EN</span>
            <Link href="/employee-access" className="rounded-full border border-primary/70 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Employee Access</Link>
            <Link href="/admin/login" className="px-1 py-2 text-xs font-semibold text-muted underline decoration-border underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Admin Login</Link>
            <Link href="/request-service" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-[#35d8bd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">Request Service</Link>
          </div>

          <button type="button" className="inline-flex size-11 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary xl:hidden" aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={isMenuOpen} aria-controls="mobile-navigation" onClick={() => setIsMenuOpen((open) => !open)}>
            <span className="sr-only">{isMenuOpen ? "Close menu" : "Open menu"}</span>
            <span className="flex w-5 flex-col gap-1.5" aria-hidden="true"><span className={`h-0.5 w-full rounded-full bg-current transition-transform ${isMenuOpen ? "translate-y-2 rotate-45" : ""}`} /><span className={`h-0.5 w-full rounded-full bg-current transition-opacity ${isMenuOpen ? "opacity-0" : ""}`} /><span className={`h-0.5 w-full rounded-full bg-current transition-transform ${isMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} /></span>
          </button>
        </div>

        <nav id="mobile-navigation" aria-label="Mobile navigation" className={`${isMenuOpen ? "block" : "hidden"} border-t border-border pb-6 xl:hidden`}>
          <p className="px-3 pt-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Public navigation</p>
          <ul className="flex flex-col py-2 text-sm font-medium text-foreground">{navigation.map((item) => <li key={item.href}><Link className="block rounded-lg px-3 py-3 transition-colors hover:bg-light-background focus-visible:outline-2 focus-visible:outline-primary" href={item.href} onClick={closeMenu}>{item.label}</Link></li>)}</ul>
          <Link href="/request-service" className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground" onClick={closeMenu}>Request Service</Link>
          <div className="mt-5 border-t border-border pt-5">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Staff access</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><Link href="/employee-access" className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary/70 px-4 py-2 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary" onClick={closeMenu}>Employee Access</Link><Link href="/admin/login" className="inline-flex min-h-11 items-center justify-center px-4 py-2 text-sm font-semibold text-muted underline decoration-primary underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary" onClick={closeMenu}>Admin Login</Link></div>
          </div>
        </nav>
      </div>
    </header>
  );
}
