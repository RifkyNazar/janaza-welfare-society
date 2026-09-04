import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskStatusBadge } from "@/components/employee/task-status-badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "Task Assignment Details" };

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function safeLocationUrl(value: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? value : null; } catch { return null; }
}

function Details({ items }: { items: Array<[string, React.ReactNode]> }) {
  return <dl className="mt-5 divide-y divide-border">{items.map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]"><dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt><dd className="break-words text-sm">{value || "—"}</dd></div>)}</dl>;
}

export default async function TaskAssignmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: value } = await params;
  if (!/^\d+$/.test(value)) notFound();
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const assignment = await prisma.taskAssignment.findUnique({
    where: { id },
    include: { employee: true, request: true },
  });
  if (!assignment) notFound();
  const request = assignment.request;
  const locationUrl = safeLocationUrl(request.locationLink);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/task-assignments" className="text-sm font-semibold text-muted underline decoration-primary decoration-2 underline-offset-4 hover:text-foreground">Back to Task Assignments</Link>
      <div className="mt-6"><p className="text-sm font-semibold text-primary">{request.requestCode}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Task Assignment</h1><div className="mt-3"><TaskStatusBadge status={assignment.status} /></div></div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Task</h2><Details items={[["Status", assignment.status.replaceAll("_", " ")], ["Accepted At", dateTimeFormatter.format(assignment.acceptedAt)], ["Started At", assignment.startedAt ? dateTimeFormatter.format(assignment.startedAt) : null], ["Completed At", assignment.completedAt ? dateTimeFormatter.format(assignment.completedAt) : null]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Employee</h2><Details items={[["Full Name", assignment.employee.fullName], ["Employee Code", assignment.employee.employeeCode], ["Phone", assignment.employee.phone], ["Position", assignment.employee.position], ["Duty", assignment.employee.duty]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Service Request</h2><Details items={[["Request Code", request.requestCode], ["Service Type", request.serviceType], ["Required Date", dateFormatter.format(request.requiredDate)], ["Required Time", request.requiredTime], ["Place Type", request.placeType], ["Request Status", request.status.replaceAll("_", " ")]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Requester</h2><Details items={[["Name", request.requesterName], ["Mobile Number", request.mobileNumber], ["Alternative Number", request.alternativeNumber], ["Relationship", request.relationshipToDeceased]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Location</h2><Details items={[["Address", request.address], ["Area", request.area], ["Location Link", locationUrl ? <a key="location" href={locationUrl} target="_blank" rel="noreferrer" className="font-semibold underline decoration-primary decoration-2 underline-offset-4">Open location</a> : null], ["Hospital Name", request.hospitalName]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Additional Note</h2><p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-muted">{request.note || "No additional note provided."}</p></section>
      </div>
    </div>
  );
}
