"use client";

import Link from "next/link";
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

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex min-h-20 items-center justify-between gap-6">
          <Link
            href="/"
            className="shrink-0 leading-tight text-foreground transition-colors hover:text-primary"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="block text-lg font-semibold tracking-tight sm:text-xl">
              Janaza Welfare Society
            </span>
            <span className="mt-1 block text-xs font-medium tracking-wide text-muted">
              Kattankudy
            </span>
          </Link>

          <div className="hidden items-center gap-5 lg:flex">
            <nav aria-label="Main navigation">
              <ul className="flex items-center gap-5 text-sm font-medium text-muted">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="py-2 transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <span className="border-l border-border pl-5 text-sm font-semibold text-foreground">
              தமிழ் <span className="text-muted">|</span> EN
            </span>
          </div>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span className="sr-only">{isMenuOpen ? "Close menu" : "Open menu"}</span>
            <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
              <span className={`h-0.5 w-full rounded-full bg-current transition-transform ${isMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-full rounded-full bg-current transition-opacity ${isMenuOpen ? "opacity-0" : ""}`} />
              <span className={`h-0.5 w-full rounded-full bg-current transition-transform ${isMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>

        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className={`${isMenuOpen ? "block" : "hidden"} border-t border-border pb-5 lg:hidden`}
        >
          <ul className="flex flex-col py-3 text-sm font-medium text-muted">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-light-background hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="border-t border-border px-3 pt-4 text-sm font-semibold text-foreground">
            தமிழ் <span className="text-muted">|</span> EN
          </p>
        </nav>
      </div>
    </header>
  );
}
