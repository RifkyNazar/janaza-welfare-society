"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useShowcaseMotion } from "@/components/use-showcase-motion";
import { T } from "@/components/public-language";
import styles from "@/app/design-preview/emerald-sanctuary/sanctuary.module.css";

export function LoopingCardRail({ label, count, children, repeat, pixelsPerSecond = 24, pauseButtonOnFocusOnly = false }: {
  label: string;
  count: number;
  children: ReactNode;
  repeat: ReactNode;
  pixelsPerSecond?: number;
  pauseButtonOnFocusOnly?: boolean;
}) {
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const original = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const motion = useShowcaseMotion(count, 1000, false);
  const [touching, setTouching] = useState(false);

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
        position = (position + Math.min(now - previous, 50) * pixelsPerSecond / 1000) % cycle;
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
  }, [count, motion.stopped, pixelsPerSecond, touching]);

  return <div className={styles.cardRail}>
    {count > 1 && <button className={pauseButtonOnFocusOnly ? `${styles.railPause} sr-only focus:not-sr-only` : styles.railPause}
      type="button" aria-controls={id}
      disabled={motion.reduced} onClick={() => motion.setPaused(!motion.paused)}>
      <T text={motion.reduced ? "Automatic motion disabled by your preference" : motion.paused ? "Play" : "Pause"} />
    </button>}
    <div id={id} ref={viewport} className={styles.railViewport} role="region" aria-label={label}
      tabIndex={count > 1 ? 0 : undefined} data-count={count}
      onMouseEnter={motion.interaction.onMouseEnter} onMouseLeave={motion.interaction.onMouseLeave}
      onFocusCapture={motion.interaction.onFocusCapture} onBlurCapture={motion.interaction.onBlurCapture}
      onTouchStart={() => pauseButtonOnFocusOnly ? setTouching(true) : motion.setPaused(true)}
      onTouchEnd={event => { if (!event.touches.length) setTouching(false); }}
      onTouchCancel={() => setTouching(false)}
      onWheel={pauseButtonOnFocusOnly ? undefined : () => motion.setPaused(true)}>
      <div className={styles.railTrack}>
        <div ref={original} className={styles.railGroup}>{children}</div>
        {count > 1 && !motion.reduced && <div ref={copy} className={`${styles.railGroup} ${styles.railCopy}`}
          aria-hidden="true" onMouseDown={event => event.preventDefault()}>{repeat}</div>}
      </div>
    </div>
  </div>;
}
