import "server-only";

const TEXTLK_ENDPOINT = "https://app.text.lk/api/v3/sms/send";
const REQUEST_TIMEOUT_MS = 10_000;

export type SmsDeliveryResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "disabled" | "configuration" | "invalid-recipient" }
  | { status: "failed" };

/** Normalize common Sri Lankan mobile formats to TEXT.LK's 947XXXXXXXX format. */
export function normalizeSriLankanMobile(value: string): string | null {
  const compact = value.trim().replace(/[\s()-]/g, "");
  const international = compact.startsWith("+94")
    ? compact.slice(1)
    : compact.startsWith("07")
      ? `94${compact.slice(1)}`
      : compact;

  return /^947\d{8}$/.test(international) ? international : null;
}

function configuredValue(name: "TEXTLK_API_TOKEN" | "TEXTLK_SENDER_ID") {
  return process.env[name]?.trim() || null;
}

export function getSmsAppBaseUrl() {
  const value = process.env.APP_BASE_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function sendSmsNotification(recipient: string, message: string): Promise<SmsDeliveryResult> {
  if (process.env.SMS_NOTIFICATIONS_ENABLED?.trim() !== "true") {
    return { status: "skipped", reason: "disabled" };
  }

  const token = configuredValue("TEXTLK_API_TOKEN");
  const senderId = configuredValue("TEXTLK_SENDER_ID");
  if (!token || !senderId) {
    console.warn("[sms] Notification skipped because TEXT.LK configuration is incomplete.");
    return { status: "skipped", reason: "configuration" };
  }

  const normalizedRecipient = normalizeSriLankanMobile(recipient);
  if (!normalizedRecipient) {
    console.warn("[sms] Notification skipped because a recipient phone number is invalid.");
    return { status: "skipped", reason: "invalid-recipient" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(TEXTLK_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: normalizedRecipient, sender_id: senderId, type: "plain", message }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error(`[sms] TEXT.LK delivery failed with HTTP status ${response.status}.`);
      return { status: "failed" };
    }
    await response.text().catch(() => "");
    return { status: "sent" };
  } catch {
    console.error("[sms] TEXT.LK delivery failed because the provider request did not complete.");
    return { status: "failed" };
  } finally {
    clearTimeout(timeout);
  }
}
