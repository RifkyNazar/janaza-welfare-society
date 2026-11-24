"use client";

import { useEffect, useState, type ReactNode } from "react";

// Hide expired content already on screen using a local timer, with no data request.
export function useAdvertisementExpiry(deadlines: readonly (number | null)[]) {
  const [expiredThrough, setExpiredThrough] = useState(0);
  const next = deadlines.reduce<number>((earliest, time) =>
    time !== null && time > expiredThrough ? Math.min(earliest, time) : earliest, Infinity);

  useEffect(() => {
    if (!Number.isFinite(next)) return;
    let timer: number;
    const check = () => {
      const now = Date.now();
      if (now >= next) setExpiredThrough(now);
      else timer = window.setTimeout(check, Math.min(next - now, 2_147_483_647));
    };
    check();
    return () => window.clearTimeout(timer);
  }, [next]);

  return expiredThrough;
}

export function AdvertisementExpiry({ expiresAt, children }: { expiresAt: number | null; children: ReactNode }) {
  const expiredThrough = useAdvertisementExpiry([expiresAt]);
  return expiresAt !== null && expiresAt <= expiredThrough ? null : children;
}
