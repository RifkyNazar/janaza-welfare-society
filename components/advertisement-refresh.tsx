"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const channelName = "jws-advertisement-changes";

export function AdvertisementMutationNotice({ mutation }: { mutation?: string | object }) {
  const published = useRef<typeof mutation>(undefined);
  useEffect(() => {
    if (!mutation || mutation === published.current || !window.BroadcastChannel) return;
    published.current = mutation;
    const channel = new window.BroadcastChannel(channelName);
    channel.postMessage("changed");
    channel.close();
  }, [mutation]);
  return null;
}

export function AdvertisementRefresh({ nextChange, hideAt, children }: {
  nextChange: number | null;
  hideAt?: number;
  children?: ReactNode;
}) {
  const router = useRouter();
  const [expiredAt, setExpiredAt] = useState<number>();
  useEffect(() => {
    const refresh = () => {
      if (hideAt !== undefined && Date.now() >= hideAt) setExpiredAt(hideAt);
      if (!document.hidden) router.refresh();
    };
    const channel = window.BroadcastChannel ? new window.BroadcastChannel(channelName) : undefined;
    const changed = (event: MessageEvent) => {
      if (event.data === "changed") refresh();
    };
    channel?.addEventListener("message", changed);
    const interval = window.setInterval(refresh, 60_000);
    let boundary: number | undefined;
    if (nextChange !== null) {
      const deadline = nextChange;
      const schedule = () => {
        const remaining = deadline - Date.now();
        if (remaining <= 0) refresh();
        else boundary = window.setTimeout(schedule, Math.max(100, Math.min(remaining, 2_147_483_647)));
      };
      schedule();
    }
    const visible = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => {
      channel?.close();
      window.clearInterval(interval);
      window.clearTimeout(boundary);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [nextChange, hideAt, router]);
  if (hideAt !== undefined && expiredAt === hideAt) return null;
  return children;
}
