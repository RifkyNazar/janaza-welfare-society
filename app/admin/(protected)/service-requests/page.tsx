import type { Metadata } from "next";
import Link from "next/link";
import type { ServiceRequestStatus } from "@/generated/prisma/enums";
import { RequestActions } from "@/components/admin/request-actions";
import { RequestStatusBadge } from "@/components/admin/request-status-badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "Service Requests" };

const statuses = ["ALL", "NEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
const requestStatuses = new Set<ServiceRequestStatus>(["NEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function ServiceRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin();

  const parameters = await searchParams;
  const requestedStatus = parameters.status?.toUpperCase();
  const status = requestedStatus === "ALL"
    ? "ALL"
    : requestedStatus && requestStatuses.has(requestedStatus as ServiceRequestStatus)
      ? requestedStatus as ServiceRequestStatus
      : "NEW";
  const query = parameters.q?.trim().slice(0, 100) ?? "";

  const requests = await prisma.serviceRequest.findMany({
    where: {
      ...(status !== "ALL" ? { status } : {}),
      ...(query ? {
        OR: [
          { requestCode: { contains: query } },
          { requesterName: { contains: query } },
          { mobileNumber: { contains: query } },
          { area: { contains: query } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      requestCode: true,
      requesterName: true,
      mobileNumber: true,
      serviceType: true,
      area: true,
      requiredDate: true,
      placeType: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Operations</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Service Requests</h1>
          <p className="mt-2 text-sm text-muted">Review public service requests and their current workflow status.</p>
        </div>
        <p className="text-sm text-muted"><span className="font-semibold text-foreground">{requests.length}</span> result{requests.length === 1 ? "" : "s"}</p>
      </div>

      <div className="mt-7 rounded-2xl border border-border bg-white p-4 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statuses.map((item) => {
            const href = `/admin/service-requests?status=${item}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
            return <Link key={item} href={href} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${item === status ? "bg-primary text-foreground" : "border border-border text-muted hover:border-primary hover:text-foreground"}`}>{item === "IN_PROGRESS" ? "In Progress" : item[0] + item.slice(1).toLowerCase()}</Link>;
          })}
        </div>

        <form action="/admin/service-requests" method="get" className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="request-search" className="sr-only">Search service requests</label>
          <input id="request-search" name="q" type="search" defaultValue={query} placeholder="Search code, requester, mobile, or area" className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <button type="submit" className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-foreground/90">Search</button>
          {query && <Link href={`/admin/service-requests?status=${status}`} className="rounded-xl border border-border px-5 py-2.5 text-center text-sm font-semibold text-muted hover:text-foreground">Clear</Link>}
        </form>
      </div>

      <section aria-label="Service requests" className="mt-6 space-y-3">
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white px-6 py-14 text-center">
            <p className="font-semibold">No service requests found</p>
            <p className="mt-2 text-sm text-muted">Try another status filter or search term.</p>
          </div>
        ) : requests.map((request) => (
          <article key={request.id} className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_26px_rgba(16,42,42,0.035)]">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-semibold tracking-wide text-primary">{request.requestCode}</p>
                <p className="mt-1 font-semibold">{request.requesterName}</p>
                <p className="mt-1 text-sm text-muted">{request.mobileNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Service</p>
                <p className="mt-1 text-sm">{request.serviceType}</p>
                <p className="mt-1 text-xs text-muted">{request.placeType}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Location</p>
                <p className="mt-1 text-sm">{request.area}</p>
              </div>
              <div>
                <RequestStatusBadge status={request.status} />
                <p className="mt-2 text-xs text-muted">Required {dateFormatter.format(request.requiredDate)}</p>
                <p className="mt-1 text-xs text-muted">Created {dateFormatter.format(request.createdAt)}</p>
              </div>
              <RequestActions requestId={request.id} status={request.status} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
