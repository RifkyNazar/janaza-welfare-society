import "server-only";

import webPush, { type PushSubscription as WebPushSubscription } from "web-push";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type SafePushPayload = { title: string; body: string; url: string; tag?: string };

let configuredKey: string | null = null;
let warnedMissing = false;

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) {
    if (!warnedMissing) {
      console.warn("[push] Notification delivery skipped because VAPID configuration is incomplete.");
      warnedMissing = true;
    }
    return false;
  }
  const key = `${publicKey}:${subject}`;
  if (configuredKey !== key) {
    try {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      configuredKey = key;
    } catch {
      console.warn("[push] Notification delivery skipped because VAPID configuration is invalid.");
      return false;
    }
  }
  return true;
}

function safePayload(payload: SafePushPayload) {
  if (!payload.url.startsWith("/") || payload.url.startsWith("//")) throw new Error("Unsafe push notification URL");
  return JSON.stringify({ title: payload.title, body: payload.body, url: payload.url, ...(payload.tag ? { tag: payload.tag } : {}) });
}

async function deliver(subscriptions: Array<{ id: string; endpoint: string; p256dh: string; auth: string }>, payload: SafePushPayload) {
  if (!subscriptions.length || !configureWebPush()) return;
  const message = safePayload(payload);
  const results = await Promise.allSettled(subscriptions.map(async (subscription) => {
    const target: WebPushSubscription = { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } };
    try {
      await webPush.sendNotification(target, message, { TTL: 60 * 60, urgency: "high", timeout: 10_000 });
    } catch (error) {
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : null;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.staffPushSubscription.deleteMany({ where: { id: subscription.id } });
        return;
      }
      throw error;
    }
  }));
  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed) console.error(`[push] ${failed} notification delivery${failed === 1 ? "" : "ies"} failed.`);
}

export async function sendPushToApprovedRole(role: UserRole, payload: SafePushPayload) {
  try {
    const subscriptions = await prisma.staffPushSubscription.findMany({
      where: { user: { role, status: "APPROVED" } },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });
    await deliver(subscriptions, payload);
  } catch {
    console.error("[push] Notification delivery failed.");
  }
}

export async function sendPushToApprovedUser(userId: number, role: UserRole, payload: SafePushPayload) {
  try {
    const subscriptions = await prisma.staffPushSubscription.findMany({
      where: { userId, user: { role, status: "APPROVED" } },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });
    await deliver(subscriptions, payload);
  } catch {
    console.error("[push] Notification delivery failed.");
  }
}
