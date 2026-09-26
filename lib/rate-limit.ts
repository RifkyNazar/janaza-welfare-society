import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

type Entry = { count: number; resetAt: number };
type Options = { limit: number; windowMs: number; discriminator?: string };

const buckets = new Map<string, Entry>();
const MAX_BUCKETS = 10_000;

function digest(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

async function clientKey() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || requestHeaders.get("x-real-ip")?.trim() || "unknown";
  return digest(address.slice(0, 200));
}

function removeExpired(now: number) {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export async function consumeRateLimit(scope: string, options: Options) {
  const now = Date.now();
  if (buckets.size >= MAX_BUCKETS) removeExpired(now);
  while (buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value as string | undefined;
    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }

  const subject = options.discriminator ? digest(options.discriminator.trim().toLowerCase().slice(0, 200)) : "all";
  const key = `${scope}:${await clientKey()}:${subject}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterSeconds: 0 } as const;
  }

  if (current.count >= options.limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) } as const;
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 } as const;
}
