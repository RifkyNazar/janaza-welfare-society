import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { RequestActions } from "@/components/admin/request-actions";
import { RequestStatusBadge } from "@/components/admin/request-status-badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { categoryLabel, serviceSummary } from "@/lib/service-options";
import { directionsUrl } from "@/lib/directions";

export const metadata: Metadata = { title: "Service Request Details" };

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function safeLocationUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}
function Details({ items }: { items: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="mt-5 divide-y divide-border">
      {items.map(([label, value]) => (
        <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
          <dd className="break-words text-sm">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function ServiceRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id: idParameter } = await params;
  if (!/^\d+$/.test(idParameter)) notFound();
  const id = Number(idParameter);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      preferredVehicle: { select: { name: true, vehicleNumber: true, vehicleType: true } },
      serviceSelections: { select: { serviceLabel: true }, orderBy: { id: "asc" } },
      taskAssignments: {
        where: { isActive: true },
        take: 1,
        select: {
          status: true,
          employee: { select: { fullName: true, employeeCode: true } },
        },
      },
    },
  });

  if (!request) notFound();
  const taskAssignment = request.taskAssignments[0];
  const locationUrl = safeLocationUrl(request.locationLink);
  const mapUrl = directionsUrl(request.latitude, request.longitude, [request.address, request.area].filter(Boolean).join(", ")) ?? locationUrl;
  const coordinates = request.latitude !== null && request.longitude !== null ? `${request.latitude}, ${request.longitude}` : null;

  return (
    <div className="mx-auto max-w-6xl">
      <BackButton fallbackHref="/admin/service-requests" label="Back to Requests" />

      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold text-primary">{request.requestCode}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Service Request</h1>
          <div className="mt-3"><RequestStatusBadge status={request.status} /></div>
        </div>
        <RequestActions requestId={request.id} status={request.status} />
        <Link href={`/supervisor/requests/${request.id}`} className="min-h-11 rounded-full border border-primary px-5 py-3 text-center text-sm font-semibold">Dispatch / Reassign</Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
          <h2 className="text-lg font-semibold">Request Information</h2>
          <Details items={[["Request Code", request.requestCode], ["Status", request.status.replaceAll("_", " ")], ["Created", dateTimeFormatter.format(request.createdAt)], ["Updated", dateTimeFormatter.format(request.updatedAt)]]} />
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
          <h2 className="text-lg font-semibold">Requester</h2>
          <Details items={request.serviceCategory ? [["Name", request.requesterName], ["Contact Number", request.mobileNumber]] : [["Name", request.requesterName], ["Mobile", request.mobileNumber], ["Alternative Number", request.alternativeNumber], ["Relationship", request.relationshipToDeceased]]} />
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
          <h2 className="text-lg font-semibold">Service</h2>
          <Details items={request.serviceCategory ? [["Category", categoryLabel(request.serviceCategory)], ["Selected Services", serviceSummary(request.serviceType, request.serviceSelections)]] : [["Service Type", request.serviceType], ["Preferred Vehicle", request.preferredVehicle ? `${request.preferredVehicle.name} · ${request.preferredVehicle.vehicleNumber} · ${request.preferredVehicle.vehicleType}` : "No Preference"], ["Required Date", dateFormatter.format(request.requiredDate)], ["Required Time", request.requiredTime], ["Place Type", request.placeType]]} />
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
          <h2 className="text-lg font-semibold">Location</h2>
          <Details items={request.serviceCategory ? [["Location / Area", request.area], ["Coordinates", coordinates], ["Directions", mapUrl ? <a key="location" href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold">Get Directions</a> : null]] : [["Address", request.address], ["Area", request.area], ["Coordinates", coordinates], ["Directions", mapUrl ? <a key="location" href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold">Get Directions</a> : null], ["Hospital Name", request.hospitalName]]} />
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
        <h2 className="text-lg font-semibold">Additional Note</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted">{request.note || "No additional note provided."}</p>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)]">
        <h2 className="text-lg font-semibold">Task Assignment</h2>
        {taskAssignment ? (
          <div className="mt-4 rounded-xl border border-border bg-light-background p-4 text-sm">
            <p className="font-semibold">{taskAssignment.employee.fullName}</p>
            <p className="mt-1 text-muted">{taskAssignment.employee.employeeCode} · {taskAssignment.status.replaceAll("_", " ")}</p>
          </div>
        ) : <p className="mt-4 text-sm text-muted">Not assigned yet</p>}
      </section>
    </div>
  );
}
