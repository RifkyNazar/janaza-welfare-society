import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-light-background text-foreground">
      <div className="footer-geometric-separator" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Janaza Care. Serving with dignity.</p>
        <div className="flex gap-5 text-muted">
          <Link href="/services" className="hover:text-foreground">Services</Link>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
