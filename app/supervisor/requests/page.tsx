import { getPortalTranslation } from "@/lib/portal-language";
import { T } from "@/components/public-language";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminOrSupervisor } from "@/lib/permissions";
import { serviceSummary } from "@/lib/service-options";

export default async function DispatchRequestsPage() {
  const { dateLocale, t } = await getPortalTranslation();
  const dt = new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short" });
  await requireAdminOrSupervisor();
  const requests = await prisma.serviceRequest.findMany({ where: { status: "NEW", taskAssignments: { none: { isActive: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], include: { serviceSelections: { orderBy: { id: "asc" } } } });
  return <div className="mx-auto max-w-7xl"><p className="text-sm font-semibold text-primary"><T text="Dispatch" /></p><h1 className="mt-1 text-3xl font-semibold"><T text="New / Unassigned Requests" /></h1><p className="mt-2 text-sm text-muted"><T text="Private operational information for authenticated dispatch only." /></p><section className="mt-7 space-y-4">{requests.length ? requests.map((r) => <article key={r.id} className="rounded-2xl border border-border bg-white p-5"><div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_auto] lg:items-center"><div><p className="text-xs font-semibold text-primary">{r.requestCode}</p><p className="mt-1 font-semibold">{serviceSummary(r.serviceType, r.serviceSelections, t)}</p><p className="mt-1 text-sm text-muted">{r.requesterName} · {r.mobileNumber}</p></div><p className="text-sm">{r.area}<br/><span className="text-xs text-muted">{r.address}</span></p><p className="text-xs text-muted"><T text="Created" /> {dt.format(r.createdAt)}</p><Link href={`/supervisor/requests/${r.id}`} className="min-h-11 rounded-xl bg-primary px-5 py-3 text-center text-sm font-semibold"><T text="Review & Assign" /></Link></div></article>) : <p className="rounded-2xl border border-border bg-white p-10 text-center text-muted"><T text="No requests need assignment." /></p>}</section></div>;
}
