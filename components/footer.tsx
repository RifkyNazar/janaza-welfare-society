"use client";
import { T } from "@/components/public-language";


import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="relative border-t border-border bg-light-background text-foreground">
      <div className="footer-geometric-separator" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-[var(--jws-gutter)] py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} <T text="Janaza Welfare Society" />. <T text="Serving with dignity." /></p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 text-muted">
          <Link href="/services" className="hover:text-foreground"><T text="Services" /></Link>
          <Link href="/contact" className="hover:text-foreground"><T text="Contact" /></Link>
        </nav>
      </div>
    </footer>
  );
}
