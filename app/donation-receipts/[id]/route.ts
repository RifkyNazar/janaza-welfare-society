import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readDonationReceipt } from "@/lib/donation-receipt-storage";

function validId(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const accountId = Number(session?.user.id);
  const donationId = validId((await params).id);
  if (!session || !Number.isSafeInteger(accountId) || accountId <= 0 || !donationId) return new Response(null, { status: 404 });
  const account = await prisma.user.findUnique({ where: { id: accountId }, select: { role: true, status: true } });
  if (account?.role !== "ADMIN" || account.status !== "APPROVED") return new Response(null, { status: 404 });
  const donation = await prisma.donation.findUnique({ where: { id: donationId }, select: { receiptStorageKey: true, receiptMimeType: true, receiptFileName: true } });
  if (!donation) return new Response(null, { status: 404 });
  const bytes = await readDonationReceipt(donation.receiptStorageKey);
  if (!bytes) return new Response(null, { status: 404 });
  const download = new URL(request.url).searchParams.get("download") === "1";
  const fallback = donation.receiptMimeType === "application/pdf" ? "receipt.pdf" : donation.receiptMimeType === "image/png" ? "receipt.png" : donation.receiptMimeType === "image/webp" ? "receipt.webp" : "receipt.jpg";
  const fileName = donation.receiptFileName.replace(/[^A-Za-z0-9._ -]/g, "_") || fallback;
  return new Response(bytes, { headers: { "Content-Type": donation.receiptMimeType, "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" } });
}
