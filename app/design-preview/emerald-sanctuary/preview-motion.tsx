"use client";

import { useEffect } from "react";
import styles from "./sanctuary.module.css";

export function PreviewMotion({ rootId = "emerald-preview" }: { rootId?: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const selectors = [styles.storyCopy, styles.sectionHead, styles.serviceCard, styles.profileCard, styles.activityTile];
    const targets = root.querySelectorAll<HTMLElement>(selectors.map(name => `.${name}`).join(","));
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer?.unobserve(entry.target);
        if (preference.matches || !(entry.target instanceof HTMLElement)) continue;
        // Content stays visible without JavaScript, before entry, and on cancellation.
        const animation = entry.target.animate([
          { opacity: 0.35, translate: "0 18px" },
          { opacity: 1, translate: "0 0" },
        ], { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)" });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
        animation.oncancel = () => animations.delete(animation);
      }
    }, { threshold: 0.08 }) : null;
    targets.forEach(target => observer?.observe(target));
    const stopMotion = () => {
      if (preference.matches) animations.forEach(animation => animation.cancel());
    };
    preference.addEventListener("change", stopMotion);
    return () => {
      observer?.disconnect();
      animations.forEach(animation => animation.cancel());
      preference.removeEventListener("change", stopMotion);
    };
  }, [rootId]);
  return null;
}
