"use client";
import { useTranslation } from "@/components/public-language";
import { useCallback, useEffect, useRef, useState } from "react";
export function useShowcaseMotion(count: number, interval = 1000, autoplay = true) {
    const [index, setIndex] = useState(0), [paused, setPaused] = useState(false), [hover, setHover] = useState(false), [focus, setFocus] = useState(false), [reduced, setReduced] = useState(false), [visible, setVisible] = useState(true);
    const start = useRef<number | null>(null);
    const move = useCallback((by: number) => setIndex(i => count ? (i + by + count) % count : 0), [count]);
    useEffect(() => { const m = matchMedia("(prefers-reduced-motion: reduce)"); const sync = () => setReduced(m.matches); const vis = () => setVisible(!document.hidden); sync(); vis(); m.addEventListener("change", sync); document.addEventListener("visibilitychange", vis); return () => { m.removeEventListener("change", sync); document.removeEventListener("visibilitychange", vis); }; }, []);
    const stopped = paused || hover || focus || reduced || !visible;
    useEffect(() => { if (!autoplay || stopped || count < 2)
        return; const t = setInterval(() => move(1), interval); return () => clearInterval(t); }, [stopped, count, move, interval, autoplay]);
    const interaction = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false), onFocusCapture: () => setFocus(true), onBlurCapture: (e: React.FocusEvent<HTMLElement>) => { if (!e.currentTarget.contains(e.relatedTarget))
            setFocus(false); }, onTouchStart: (e: React.TouchEvent<HTMLElement>) => { start.current = e.touches[0].clientX; setPaused(true); }, onTouchEnd: (e: React.TouchEvent<HTMLElement>) => { if (start.current !== null) {
            const d = start.current - e.changedTouches[0].clientX;
            if (Math.abs(d) > 45)
                move(d > 0 ? 1 : -1);
        } start.current = null; } };
    return { index: index % Math.max(count, 1), setIndex, move, paused, setPaused, reduced, stopped, interaction };
}
export function MotionControls({ motion: m, label, count }: {
    motion: ReturnType<typeof useShowcaseMotion>;
    label: string;
    count: number;
}) {
    const { t } = useTranslation();
    if (count < 2)
        return null;
    return <div className="motion-controls" role="group" aria-label={t(label)}><button type="button" onClick={() => m.move(-1)} aria-label={t("Previous")}>&larr;</button><button type="button" disabled={m.reduced} aria-pressed={m.paused || m.reduced} onClick={() => m.setPaused(!m.paused)} aria-label={t(m.reduced ? "Automatic motion disabled by your preference" : m.paused ? "Play" : "Pause")}>{t(m.paused || m.reduced ? "Play" : "Pause")}</button><span className="text-xs tabular-nums">{String(m.index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span><button type="button" onClick={() => m.move(1)} aria-label={t("Next")}>&rarr;</button></div>;
}
