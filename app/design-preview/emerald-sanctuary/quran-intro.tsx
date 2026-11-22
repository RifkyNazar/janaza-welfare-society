"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { quranVerse } from "./preview-copy";
import styles from "./sanctuary.module.css";

export function QuranIntro({ cookiePath = "/design-preview/emerald-sanctuary", storageKey = "jws-emerald-intro-seen" }: { cookiePath?: string; storageKey?: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const node = panel.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || motion.matches || window.location.hash) return;
    try {
      const seen = document.cookie.split(";").some(cookie => cookie.trim() === `${storageKey}=1`) || sessionStorage.getItem(storageKey);
      if (seen && !started.current) return;
      sessionStorage.setItem(storageKey, "1");
      document.cookie = `${storageKey}=1; Path=${cookiePath}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      started.current = true;
    } catch { return; }
    node.hidden = false;
    const dismiss = () => { node.hidden = true; };
    const onMotion = () => { if (motion.matches) dismiss(); };
    const timer = window.setTimeout(dismiss, 2400);
    window.addEventListener("pointerdown", dismiss, { once: true, capture: true });
    window.addEventListener("keydown", dismiss, { once: true, capture: true });
    window.addEventListener("wheel", dismiss, { once: true, passive: true });
    window.addEventListener("pagehide", dismiss, { once: true });
    document.addEventListener("visibilitychange", dismiss, { once: true });
    motion.addEventListener("change", onMotion);
    return () => {
      clearTimeout(timer);
      dismiss();
      window.removeEventListener("pointerdown", dismiss, true);
      window.removeEventListener("keydown", dismiss, true);
      window.removeEventListener("wheel", dismiss);
      window.removeEventListener("pagehide", dismiss);
      document.removeEventListener("visibilitychange", dismiss);
      motion.removeEventListener("change", onMotion);
    };
  }, [cookiePath, storageKey]);
  return <div ref={panel} hidden aria-hidden="true" className={styles.quranIntro}><div className={styles.introAtmosphere} /><div className={styles.introContent}><p lang="ar" dir="rtl" className={styles.introVerse}>{quranVerse}</p><span className={styles.introReference}>Surah Aal-Imran · 3:185</span><div className={styles.introLogo}><Image src="/images/jws/logo.png" alt="" width={76} height={76} /></div></div></div>;
}
