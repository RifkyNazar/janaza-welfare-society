import { auth } from "@/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const keyPattern = /^[A-Za-z0-9_-]+$/;

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

async function approvedStaff() {
  const session = await auth();
  const userId = Number(session?.user.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) return null;
  return prisma.user.findFirst({ where: { id: userId, status: "APPROVED", role: { in: ["ADMIN", "SUPERVISOR", "EMPLOYEE"] } }, select: { id: true } });
}

async function input(request: Request) {
  try {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > 10_000) return null;
    const rawBody = await request.text();
    if (rawBody.length > 10_000) return null;
    const body = JSON.parse(rawBody) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
    const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
    const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh.trim() : "";
    const authKey = typeof body.keys?.auth === "string" ? body.keys.auth.trim() : "";
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || endpoint.length > 500 || !p256dh || p256dh.length > 255 || !authKey || authKey.length > 100 || !keyPattern.test(p256dh) || !keyPattern.test(authKey)) return null;
    return { endpoint, p256dh, auth: authKey };
  } catch { return null; }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const [user, subscription] = await Promise.all([approvedStaff(), input(request)]);
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!subscription) return Response.json({ error: "Invalid push subscription." }, { status: 400 });
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null;
  const existing = await prisma.staffPushSubscription.findUnique({ where: { endpoint: subscription.endpoint }, select: { userId: true } });
  if (existing && existing.userId !== user.id) return Response.json({ error: "Subscription is already registered." }, { status: 409 });
  try {
    await prisma.staffPushSubscription.upsert({ where: { endpoint: subscription.endpoint }, create: { userId: user.id, userAgent, ...subscription }, update: { userId: user.id, userAgent, p256dh: subscription.p256dh, auth: subscription.auth } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return Response.json({ error: "Unable to save subscription." }, { status: 409 });
    throw error;
  }
  return Response.json({ enabled: true });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const [user, subscription] = await Promise.all([approvedStaff(), input(request)]);
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  if (!subscription) return Response.json({ error: "Invalid push subscription." }, { status: 400 });
  await prisma.staffPushSubscription.deleteMany({ where: { userId: user.id, endpoint: subscription.endpoint } });
  return Response.json({ enabled: false });
}
