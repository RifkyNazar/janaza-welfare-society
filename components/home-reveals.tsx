"use client";
import { useEffect } from "react";
export function HomeReveals() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("jws-revealed");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    // Animate on entry without hiding SSR content or depending on JS for visibility.
    document.querySelectorAll(
      ".jws-home section:not(:first-child) :is(h2, p, img), .jws-home .operation-gallery-card"
    ).forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return null;
}
