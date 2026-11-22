import { getPortalTranslation } from "@/lib/portal-language";
import { T } from "@/components/public-language";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { DonationReviewAction } from "@/components/admin/donation-review-action";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { reviewDonation } from "../actions";

export const metadata: Metadata = { title: "Donation Details" };


const money = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" });

export default async function DonationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { dateLocale, t } = await getPortalTranslation();
  const dateTime = new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" });
  const date = new Intl.DateTimeFormat(dateLocale, { dateStyle: "long", timeZone: "UTC" });
  await requireAdmin();
  const value = (await params).id;
  if (!/^\d+$/.test(value)) notFound();
  const id = Number(value); if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const donation = await prisma.donation.findUnique({ where: { id }, include: { reviewedBy: { select: { email: true } } } });
  if (!donation) notFound();
  const items: Array<[string, string]> = [["Reference Code", donation.referenceCode], ["Donor Name", donation.fullName], ["Mobile Number", donation.mobileNumber], ["Amount", money.format(Number(donation.amount))], ["Transfer Date", date.format(donation.transferDate)], ["Bank Reference", donation.bankReference || t("Not provided")], ["Submitted Date", dateTime.format(donation.createdAt)], ["Current Status", t(donation.status === "PENDING" ? "Pending Verification" : donation.status === "VERIFIED" ? "Verified" : "Rejected")], ["Reviewed At", donation.reviewedAt ? dateTime.format(donation.reviewedAt) : t("Not reviewed")], ["Reviewed By", donation.reviewedBy?.email ?? t("Not reviewed")], ["Review Note", donation.reviewNote || t("Not provided")]];
  return <div className="mx-auto max-w-5xl"><BackButton fallbackHref="/admin/donations" /><p className="mt-6 text-sm font-semibold text-primary"><T text="Private donation record" /></p><h1 className="mt-1 text-3xl font-semibold">{donation.referenceCode}</h1><div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"><section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold"><T text="Transfer Confirmation" /></h2><dl className="mt-5 divide-y divide-border">{items.map(([label, content]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]"><dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t(label)}</dt><dd className="break-words text-sm">{content}</dd></div>)}</dl><div className="mt-5"><p className="text-xs font-semibold uppercase tracking-wider text-muted"><T text="Message / Note" /></p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{donation.note || <T text="No message provided." />}</p></div></section>
    <div className="space-y-6"><section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold"><T text="Private Receipt" /></h2><p className="mt-2 break-words text-sm text-muted">{donation.receiptFileName}</p><div className="mt-5 grid gap-3"><Link href={`/donation-receipts/${donation.id}`} target="_blank" className="rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold"><T text="View Receipt" /></Link><Link href={`/donation-receipts/${donation.id}?download=1`} className="rounded-full border border-border px-5 py-3 text-center text-sm font-semibold hover:border-primary"><T text="Download Receipt" /></Link></div><p className="mt-4 text-xs leading-5 text-muted"><T text="This file is private and served only after admin authorization is re-checked." /></p></section>
    {donation.status === "PENDING" ? <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold"><T text="Review" /></h2><p className="mt-2 text-sm text-muted"><T text="Review the bank transfer details and proof before choosing an action." /></p><div className="mt-5 space-y-4"><DonationReviewAction action={reviewDonation.bind(null, donation.id, "VERIFIED")} label="Verify Donation" /><DonationReviewAction action={reviewDonation.bind(null, donation.id, "REJECTED")} label="Reject Confirmation" reject /></div></section> : <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold"><T text="Review Complete" /></h2><p className="mt-2 text-sm text-muted"><T text="Normal review controls are locked after a final decision." /></p></section>}
    </div></div></div>;
}
