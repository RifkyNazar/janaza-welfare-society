"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useShowcaseMotion } from "@/components/use-showcase-motion";
import styles from "@/app/design-preview/emerald-sanctuary/sanctuary.module.css";

export function LoopingCardRail({ label, count, children, repeat, overflowOnly = false }: {
  label: string;
  count: number;
  children: ReactNode;
  repeat: ReactNode;
  overflowOnly?: boolean;
}) {
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const original = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const motion = useShowcaseMotion(count, 1000, false);
  const [touching, setTouching] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const loops = count > 1 && (!overflowOnly || overflows);

  useEffect(() => {
    const element = viewport.current;
    const group = original.current;
    if (!overflowOnly || count < 2 || !element || !group) return;

    // Measure only the original group so the loop copy cannot trigger overflow.
    const measure = () => setOverflows(group.offsetWidth > element.clientWidth);
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    resize.observe(group);
    measure();
    return () => resize.disconnect();
  }, [count, overflowOnly]);

  useEffect(() => {
    const element = viewport.current;
    const first = original.current;
    const second = copy.current;
    if (!element || !first || !second || motion.stopped || touching) return;

    let frame = 0;
    let previous = 0;
    let position = element.scrollLeft;
    let cycle = 0;
    const tick = (now: number) => {
      if (cycle > 0 && previous) {
        position = (position + Math.min(now - previous, 50) * 66 / 1000) % cycle;
        element.scrollLeft = position;
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    const resize = new ResizeObserver(() => {
      cycle = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
      position = element.scrollLeft;
    });
    resize.observe(first);
    const visibility = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      previous = 0;
      position = element.scrollLeft;
      if (entry.isIntersecting) frame = requestAnimationFrame(tick);
    });
    visibility.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      resize.disconnect();
    };
  }, [count, loops, motion.stopped, touching]);

  return <div className={styles.cardRail}>

    <div id={id} ref={viewport} className={styles.railViewport} role="region" aria-label={label}
      tabIndex={loops ? 0 : undefined} data-count={count}
      onMouseEnter={motion.interaction.onMouseEnter} onMouseLeave={motion.interaction.onMouseLeave}
      onFocusCapture={motion.interaction.onFocusCapture} onBlurCapture={motion.interaction.onBlurCapture}
      onTouchStart={() => setTouching(true)}
      onTouchEnd={event => { if (!event.touches.length) setTouching(false); }}
      onTouchCancel={() => setTouching(false)}>
      <div className={styles.railTrack}>
        <div ref={original} className={styles.railGroup}>{children}</div>
        {loops && !motion.reduced && <div ref={copy} className={`${styles.railGroup} ${styles.railCopy}`}
          aria-hidden="true" onMouseDown={event => event.preventDefault()}>{repeat}</div>}
      </div>
    </div>
  </div>;
}
