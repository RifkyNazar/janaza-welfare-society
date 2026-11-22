"use client";
import { T } from "@/components/public-language";
import { useAutoScrollRail } from "@/components/auto-scroll-rail";
import type { ReactNode } from "react";
import { useShowcaseMotion } from "@/components/use-showcase-motion";
export function OperationsGallery({ children, count }: {
    children: ReactNode;
    count: number;
}) {
    // A single set of cards keeps the accessible tree free of cloned announcements.
    const m = useShowcaseMotion(1);
    const rail = useAutoScrollRail(m.stopped, count);
    function move(by: number) { m.setPaused(true); rail.current?.scrollBy({ left: by * (rail.current.clientWidth * .8), behavior: m.reduced ? 'instant' : 'smooth' }); }
    return <div {...m.interaction}><div className="mt-8 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-white/65"><T text="Explore the work. See the care." /></span>{count > 1 && <div className="motion-controls"><button type="button" aria-label="Previous operations" onClick={() => move(-1)}>&larr;</button><button type="button" disabled={m.reduced} aria-pressed={m.paused || m.reduced} onClick={() => m.setPaused(!m.paused)}><T text={m.paused || m.reduced ? "Play" : "Pause"} /></button><button type="button" aria-label="Next operations" onClick={() => move(1)}>&rarr;</button></div>}</div><div ref={rail} className="operations-rail mt-5" onWheel={() => m.setPaused(true)} onPointerDown={() => m.setPaused(true)}>{children}</div></div>;
}
