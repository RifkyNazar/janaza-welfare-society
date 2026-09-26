import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { TaskStatusBadge } from "@/components/employee/task-status-badge";
import { PhotoReviewAction } from "@/components/admin/photo-review-action";
import { reviewTaskPhoto } from "../photo-actions";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { trustedMapUrl } from "@/lib/directions";

export const metadata: Metadata = { title: "Task Assignment Details" };

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

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
    include: { employee: true, request: true, operation: { select: { id: true } }, photos: { select: { id: true, caption: true, uploadedAt: true, isApprovedForPublic: true }, orderBy: { uploadedAt: "desc" } } },
  });
  if (!assignment) notFound();
  const request = assignment.request;
  const locationUrl = trustedMapUrl(request.locationLink);

  return (
    <div className="mx-auto max-w-6xl">
      <BackButton fallbackHref="/admin/task-assignments" label="Back to Task Assignments" />
      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-sm font-semibold text-primary">{request.requestCode}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Task Assignment</h1><div className="mt-3"><TaskStatusBadge status={assignment.status} /></div></div>{assignment.operation ? <Link href={`/admin/operations/${assignment.operation.id}`} className="rounded-full border border-primary px-6 py-3 text-center text-sm font-semibold">Manage Public Operation</Link> : assignment.status === "COMPLETED" && request.status === "COMPLETED" ? <Link href={`/admin/operations/new?taskId=${assignment.id}`} className="rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold">Create Public Operation</Link> : null}</div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Task</h2><Details items={[["Status", assignment.status.replaceAll("_", " ")], ["Accepted At", dateTimeFormatter.format(assignment.acceptedAt)], ["Started At", assignment.startedAt ? dateTimeFormatter.format(assignment.startedAt) : null], ["Completed At", assignment.completedAt ? dateTimeFormatter.format(assignment.completedAt) : null], ["Photo Review", assignment.photosSubmittedAt ? `Photos Submitted for Review — ${dateTimeFormatter.format(assignment.photosSubmittedAt)}` : "Not Yet Submitted"]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Employee</h2><Details items={[["Full Name", assignment.employee.fullName], ["Employee Code", assignment.employee.employeeCode], ["Phone", assignment.employee.phone], ["Position", assignment.employee.position], ["Duty", assignment.employee.duty]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Service Request</h2><Details items={[["Request Code", request.requestCode], ["Service Type", request.serviceType], ["Required Date", dateFormatter.format(request.requiredDate)], ["Required Time", request.requiredTime], ["Place Type", request.placeType], ["Request Status", request.status.replaceAll("_", " ")]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Requester</h2><Details items={[["Name", request.requesterName], ["Mobile Number", request.mobileNumber], ["Alternative Number", request.alternativeNumber], ["Relationship", request.relationshipToDeceased]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Location</h2><Details items={[["Address", request.address], ["Area", request.area], ["Location Link", locationUrl ? <a key="location" href={locationUrl} target="_blank" rel="noreferrer" className="font-semibold underline decoration-primary decoration-2 underline-offset-4">Open location</a> : null], ["Hospital Name", request.hospitalName]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Additional Note</h2><p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-muted">{request.note || "No additional note provided."}</p></section>
      </div>
      <section className="mt-6 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-lg font-semibold">Task Photos</h2>
        <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${assignment.photosSubmittedAt ? "bg-primary/25 text-foreground" : "bg-light-background text-muted"}`}>{assignment.photosSubmittedAt ? "Photos Submitted for Review" : "Not Yet Submitted"}</p>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">Only approve photos that are suitable for public use and do not expose private or sensitive information.</div>
        {assignment.photos.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{assignment.photos.map((photo) => <article key={photo.id} className="overflow-hidden rounded-2xl border border-border"><Image unoptimized src={`/task-photos/${photo.id}`} alt={photo.caption || "Task photo for admin review"} width={800} height={600} className="aspect-[4/3] w-full object-cover" /><div className="p-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${photo.isApprovedForPublic ? "bg-primary/25 text-foreground" : "bg-light-background text-muted"}`}>{photo.isApprovedForPublic ? "Approved for Public Use" : "Private / Not Approved"}</span><p className="mt-3 text-sm">{photo.caption || "No caption"}</p><p className="mt-2 text-xs text-muted">Uploaded {dateTimeFormatter.format(photo.uploadedAt)}</p><p className="mt-1 text-xs text-muted">Employee: {assignment.employee.fullName}</p><PhotoReviewAction approved={photo.isApprovedForPublic} action={reviewTaskPhoto.bind(null, photo.id, !photo.isApprovedForPublic)} /></div></article>)}</div> : <p className="mt-5 rounded-xl bg-light-background p-5 text-sm text-muted">No photos have been uploaded for this assignment.</p>}
      </section>
    </div>
  );
}
