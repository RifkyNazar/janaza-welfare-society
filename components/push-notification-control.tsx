"use client";

import { useEffect, useState } from "react";

type State = "checking" | "disabled" | "enabled" | "denied" | "unsupported" | "unconfigured" | "error";

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bytes = atob(base64);
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}

function supported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function PushNotificationControl({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [state, setState] = useState<State>("checking");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    async function inspect() {
      if (!supported()) { if (active) setState("unsupported"); return; }
      if (!vapidPublicKey) { if (active) setState("unconfigured"); return; }
      if (Notification.permission === "denied") { if (active) setState("denied"); return; }
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (active) setState(subscription ? "enabled" : "disabled");
    }
    inspect().catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [vapidPublicKey]);

  async function enable() {
    if (!supported()) { setState("unsupported"); return; }
    if (!vapidPublicKey) { setState("unconfigured"); return; }
    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "denied" : "disabled"); return; }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(vapidPublicKey) });
      const response = await fetch("/api/push-subscriptions", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
      if (!response.ok) throw new Error("Subscription save failed");
      setState("enabled");
    } catch { setState("error"); }
    finally { setPending(false); }
  }

  async function disable() {
    if (!supported()) { setState("unsupported"); return; }
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch("/api/push-subscriptions", { method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
        if (!response.ok) throw new Error("Subscription removal failed");
        await subscription.unsubscribe();
      }
      setState("disabled");
    } catch { setState("error"); }
    finally { setPending(false); }
  }

  const message = state === "enabled" ? "Notifications are enabled on this device." : state === "denied" ? "Notification permission was denied. You can change it in your browser settings." : state === "unsupported" ? "This browser does not support web notifications." : state === "unconfigured" ? "Browser notifications are not configured on this server." : state === "error" ? "Unable to update notifications. Please try again." : state === "checking" ? "Checking this device…" : "Receive JWS alerts on this device.";

  return <section aria-labelledby="browser-notifications-title" className="mt-7 rounded-2xl border border-border bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 id="browser-notifications-title" className="font-semibold">Browser Notifications</h2><p role="status" aria-live="polite" className="mt-1 text-sm text-muted">{message}</p></div>{state === "enabled" ? <button type="button" disabled={pending} onClick={disable} className="min-h-11 shrink-0 rounded-xl border border-border px-5 text-sm font-semibold disabled:opacity-60">{pending ? "Disabling…" : "Disable Notifications"}</button> : <button type="button" disabled={pending || state === "checking" || state === "unsupported" || state === "unconfigured" || state === "denied"} onClick={enable} className="min-h-11 shrink-0 rounded-xl bg-primary px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Enabling…" : "Enable Notifications"}</button>}</div></section>;
}
