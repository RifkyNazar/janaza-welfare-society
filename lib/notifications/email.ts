import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import type { EmailMessage } from "@/lib/notifications/types";

type EmailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  appBaseUrl: string;
};

let cachedTransporter: Transporter | null = null;
let cachedTransportKey = "";

function nonEmpty(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

function getEmailConfig(): EmailConfig | null {
  const host = nonEmpty("SMTP_HOST");
  const portValue = nonEmpty("SMTP_PORT");
  const secureValue = nonEmpty("SMTP_SECURE");
  const user = nonEmpty("SMTP_USER");
  const pass = nonEmpty("SMTP_PASS");
  const from = nonEmpty("EMAIL_FROM");
  const baseUrlValue = nonEmpty("APP_BASE_URL");
  const missing = [
    ["SMTP_HOST", host],
    ["SMTP_PORT", portValue],
    ["SMTP_SECURE", secureValue],
    ["SMTP_USER", user],
    ["SMTP_PASS", pass],
    ["EMAIL_FROM", from],
    ["APP_BASE_URL", baseUrlValue],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    console.warn(`[email] Notification skipped because email is not configured. Missing: ${missing.join(", ")}.`);
    return null;
  }

  const port = Number(portValue);
  const secure = secureValue?.toLowerCase();
  if (!Number.isInteger(port) || port < 1 || port > 65535 || (secure !== "true" && secure !== "false")) {
    console.warn("[email] Notification skipped because SMTP_PORT or SMTP_SECURE is invalid.");
    return null;
  }

  let appBaseUrl: string;
  try {
    const url = new URL(baseUrlValue!);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported protocol");
    appBaseUrl = url.toString().replace(/\/$/, "");
  } catch {
    console.warn("[email] Notification skipped because APP_BASE_URL is not a valid HTTP(S) URL.");
    return null;
  }

  return { host: host!, port, secure: secure === "true", user: user!, pass: pass!, from: from!, appBaseUrl };
}

export function getEmailAppBaseUrl() {
  return getEmailConfig()?.appBaseUrl ?? null;
}

export async function sendEmailNotification(message: EmailMessage) {
  const config = getEmailConfig();
  if (!config) return { status: "skipped" as const };

  const transportKey = `${config.host}:${config.port}:${config.secure}:${config.user}`;
  if (!cachedTransporter || cachedTransportKey !== transportKey) {
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });
    cachedTransportKey = transportKey;
  }

  await cachedTransporter.sendMail({
    from: config.from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
  return { status: "sent" as const };
}
