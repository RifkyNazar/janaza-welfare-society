import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { AssignmentForm } from "@/components/supervisor/assignment-form";
import { assignEmployee, reassignEmployee } from "@/app/supervisor/actions";
import { directionsUrl } from "@/lib/directions";
import { prisma } from "@/lib/prisma";
import { requireAdminOrSupervisor } from "@/lib/permissions";
import { serviceSummary } from "@/lib/service-options";

const dt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function DispatchRequestDetails({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminOrSupervisor();
  const raw = (await params).id;
  if (!/^\d+$/.test(raw)) notFound();
  const id = Number(raw);
  const [request, profiles] = await Promise.all([
    prisma.serviceRequest.findUnique({ where: { id }, include: { serviceSelections: { orderBy: { id: "asc" } }, taskAssignments: { orderBy: { assignedAt: "desc" }, include: { employee: { select: { fullName: true, employeeCode: true } }, assignedBy: { select: { email: true } } } } } }),
    prisma.employeeProfile.findMany({ where: { user: { role: "EMPLOYEE", status: "APPROVED" } }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true, availability: true, _count: { select: { taskAssignments: { where: { isActive: true, status: { in: ["ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS"] } } } } } } }),
  ]);
  if (!request) notFound();
  const current = request.taskAssignments.find((assignment) => assignment.isActive);
  const employees = profiles.map((profile) => ({ id: profile.id, name: profile.fullName, availability: profile.availability, active: profile._count.taskAssignments }));
  const location = directionsUrl(request.latitude, request.longitude, [request.address, request.area].filter(Boolean).join(", "));
  const details: Array<[string, string | null]> = [["Customer", request.requesterName], ["Contact", request.mobileNumber], ["Location / Area", request.area], ["Address", request.address], ["Coordinates", request.latitude !== null && request.longitude !== null ? `${request.latitude}, ${request.longitude}` : null], ["Notes", request.note], ["Status", request.status], ["Created", dt.format(request.createdAt)]];

  return <div className="mx-auto max-w-5xl">
    <BackButton fallbackHref="/supervisor/requests" label="Back to Requests" />
    <div className="mt-6"><p className="text-sm font-semibold text-primary">{request.requestCode}</p><h1 className="mt-1 text-3xl font-semibold">{serviceSummary(request.serviceType, request.serviceSelections)}</h1></div>
    <div className="mt-7 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-white p-5"><h2 className="font-semibold">Operational request details</h2><dl className="mt-4 divide-y divide-border">{details.map(([key, value]) => <div key={key} className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr]"><dt className="text-xs font-semibold uppercase text-muted">{key}</dt><dd className="break-words text-sm">{value || "—"}</dd></div>)}</dl>{location && <a href={location} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-primary px-5 text-sm font-semibold">Get Directions</a>}</section>
      <div>{current && <p className="mb-4 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm">Current: <strong>{current.employee.fullName}</strong> ({current.status.replaceAll("_", " ")})</p>}<AssignmentForm action={(current ? reassignEmployee : assignEmployee).bind(null, request.id)} employees={employees} label={current ? "Reassign Employee" : "Assign Employee"} /></div>
    </div>
    <section className="mt-6 rounded-2xl border border-border bg-white p-5"><h2 className="font-semibold">Assignment History</h2>{request.taskAssignments.length ? <div className="mt-3 divide-y divide-border">{request.taskAssignments.map((assignment) => <div key={assignment.id} className="py-3 text-sm"><strong>{assignment.employee.fullName}</strong> · {assignment.status.replaceAll("_", " ")} · {dt.format(assignment.assignedAt)}{assignment.assignedBy ? ` · by ${assignment.assignedBy.email}` : ""}</div>)}</div> : <p className="mt-3 text-sm text-muted">No assignment history.</p>}</section>
  </div>;
}
