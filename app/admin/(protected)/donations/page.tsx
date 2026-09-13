import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "Donations" };
const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const money = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" });

export default async function AdminDonationsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin();
  const parameters = await searchParams;
  const allowed = ["PENDING", "VERIFIED", "REJECTED"] as const;
  const status = allowed.includes(parameters.status as typeof allowed[number]) ? parameters.status as typeof allowed[number] : "ALL";
  const q = parameters.q?.trim().slice(0, 100) ?? "";
  const donations = await prisma.donation.findMany({ where: { ...(status !== "ALL" ? { status } : {}), ...(q ? { OR: [{ referenceCode: { contains: q } }, { fullName: { contains: q } }, { mobileNumber: { contains: q } }, { bankReference: { contains: q } }] } : {}) }, orderBy: { createdAt: "desc" }, select: { id: true, referenceCode: true, fullName: true, mobileNumber: true, amount: true, transferDate: true, status: true, createdAt: true } });
  return <div className="mx-auto max-w-7xl"><p className="text-sm font-semibold text-primary">Private records</p><h1 className="mt-1 text-3xl font-semibold">Donations</h1><p className="mt-2 text-sm text-muted">Review bank-transfer confirmation submissions and private proof.</p>
    <div className="mt-7 rounded-2xl border border-border bg-white p-4"><div className="flex flex-wrap gap-2">{[["ALL","All"],["PENDING","Pending"],["VERIFIED","Verified"],["REJECTED","Rejected"]].map(([key,label]) => <Link key={key} href={`/admin/donations?status=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`rounded-full px-4 py-2 text-sm font-semibold ${status === key ? "bg-primary" : "border border-border"}`}>{label}</Link>)}</div><form className="mt-4 flex gap-2"><input type="hidden" name="status" value={status} /><input name="q" type="search" defaultValue={q} placeholder="Search reference, donor, mobile, or bank reference" className="min-w-0 flex-1 rounded-xl border border-border px-4 py-3 outline-none focus:border-primary" /><button className="rounded-xl bg-foreground px-5 text-sm font-semibold text-white">Search</button></form></div>
    <div className="mt-6 space-y-4">{donations.length ? donations.map((donation) => <article key={donation.id} className="grid gap-4 rounded-2xl border border-border bg-white p-5 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center"><div><StatusBadge status={donation.status} /><h2 className="mt-3 font-semibold">{donation.referenceCode}</h2><p className="mt-1 text-sm text-muted">{donation.fullName} · {donation.mobileNumber}</p></div><div className="text-sm"><p className="font-semibold">{money.format(Number(donation.amount))}</p><p className="mt-1 text-muted">Transferred {date.format(donation.transferDate)}</p></div><p className="text-sm text-muted">Submitted {date.format(donation.createdAt)}</p><Link href={`/admin/donations/${donation.id}`} className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold hover:border-primary">Review</Link></article>) : <p className="rounded-2xl border border-border bg-white p-10 text-center text-muted">No donation confirmations found.</p>}</div>
  </div>;
}

function StatusBadge({ status }: { status: "PENDING" | "VERIFIED" | "REJECTED" }) { return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === "VERIFIED" ? "bg-primary/25" : status === "REJECTED" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>{status === "PENDING" ? "Pending Verification" : status[0] + status.slice(1).toLowerCase()}</span>; }
