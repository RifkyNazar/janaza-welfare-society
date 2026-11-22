"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useShowcaseMotion } from "@/components/use-showcase-motion";

/** Native scrolling preserves swipe and link focus; no duplicate cards are rendered. */
export function useAutoScrollRail(stopped: boolean, count: number) {
  const rail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = rail.current;
    if (!element || stopped || count < 2) return;
    let frame = 0;
    let previous = 0;
    let position = element.scrollLeft;
    const tick = (now: number) => {
      if (previous) {
        position += Math.min(now - previous, 50) * 0.025;
        const end = element.scrollWidth - element.clientWidth;
        if (end > 1) {
          if (position >= end) position = 0;
          element.scrollLeft = position;
        }
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    // Suspends hidden category rails and sections outside the viewport.
    const observer = new IntersectionObserver(entries => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (entries[0].isIntersecting) frame = requestAnimationFrame(tick);
    });
    observer.observe(element);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [stopped, count]);
  return rail;
}

export function PortraitRail({ children, count, stopped = false }: { children: ReactNode; count: number; stopped?: boolean }) {
  const motion = useShowcaseMotion(1);
  const rail = useAutoScrollRail(motion.stopped || stopped, count);
  return <div ref={rail} className="portrait-rail" {...motion.interaction}
    onWheel={() => motion.setPaused(true)} onPointerDown={() => motion.setPaused(true)}>
    {children}
  </div>;
}
