import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { acknowledgeTask, completeTask, startTask } from "@/app/employee/(protected)/actions";
import { TaskAction } from "@/components/employee/task-action";
import { TaskStatusBadge } from "@/components/employee/task-status-badge";
import { TaskPhotoUpload } from "@/components/employee/task-photo-upload";
import { submitPhotosForReview, uploadTaskPhoto } from "./photo-actions";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";
import { categoryLabel, serviceSummary } from "@/lib/service-options";
import { directionsUrl } from "@/lib/directions";

export const metadata: Metadata = { title: "Task Details" };
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function safeUrl(value: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? value : null; } catch { return null; }
}

function Details({ items }: { items: Array<[string, React.ReactNode]> }) {
  return <dl className="mt-5 divide-y divide-border">{items.map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]"><dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt><dd className="break-words text-sm">{value || "—"}</dd></div>)}</dl>;
}

export default async function MyTaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireEmployee();
  const profileId = session.user.employeeProfileId;
  const { id: value } = await params;
  if (!profileId || !/^\d+$/.test(value)) notFound();
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const task = await prisma.taskAssignment.findFirst({
    where: { id, employeeId: profileId, OR: [{ isActive: true }, { status: "COMPLETED" }] },
    include: {
      request: {
        include: {
          preferredVehicle: { select: { name: true, vehicleNumber: true, vehicleType: true } },
          serviceSelections: { select: { serviceLabel: true }, orderBy: { id: "asc" } },
        },
      },
      photos: { select: { id: true, caption: true, uploadedAt: true, isApprovedForPublic: true }, orderBy: { uploadedAt: "desc" } },
    },
  });
  if (!task) notFound();
  const request = task.request;
  const locationUrl = safeUrl(request.locationLink);
  const routeUrl = directionsUrl(request.latitude, request.longitude, [request.address, request.area].filter(Boolean).join(", ")) ?? locationUrl;

  return (
    <div className="mx-auto max-w-6xl">
      <BackButton fallbackHref={task.status === "COMPLETED" ? "/employee/completed" : "/employee/my-tasks"} label={task.status === "COMPLETED" ? "Back to Completed Tasks" : "Back to My Tasks"} />
      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-sm font-semibold text-primary">{request.requestCode}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{serviceSummary(request.serviceType, request.serviceSelections)}</h1><div className="mt-3"><TaskStatusBadge status={task.status} /></div></div><div>{task.status === "ASSIGNED" && <TaskAction action={acknowledgeTask.bind(null, task.id)} label="Acknowledge Task" />}{task.status === "ACKNOWLEDGED" && <TaskAction action={startTask.bind(null, task.id)} label="Start Task" />}{task.status === "IN_PROGRESS" && <TaskAction action={completeTask.bind(null, task.id)} label="Complete Task" confirmation="Complete this task? This will mark the service request as completed." />}</div></div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Request</h2><Details items={request.serviceCategory ? [["Request Code", request.requestCode], ["Category", categoryLabel(request.serviceCategory)], ["Selected Services", serviceSummary(request.serviceType, request.serviceSelections)], ["Additional Note", request.note]] : [["Request Code", request.requestCode], ["Service Type", request.serviceType], ["Preferred Vehicle", request.preferredVehicle ? `${request.preferredVehicle.name} · ${request.preferredVehicle.vehicleNumber} · ${request.preferredVehicle.vehicleType}` : "No Preference"], ["Required Date", dateFormatter.format(request.requiredDate)], ["Required Time", request.requiredTime], ["Place Type", request.placeType], ["Note", request.note]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Requester</h2><Details items={request.serviceCategory ? [["Name", request.requesterName], ["Contact Number", request.mobileNumber]] : [["Name", request.requesterName], ["Mobile Number", request.mobileNumber], ["Alternative Number", request.alternativeNumber], ["Relationship", request.relationshipToDeceased]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Location</h2><Details items={[["Address", request.address], ["Area", request.area], ["Directions", routeUrl ? <a key="map" href={routeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold">Get Directions</a> : null], ["Hospital Name", request.hospitalName]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Task</h2><Details items={[["Task Status", task.status.replaceAll("_", " ")], ["Accepted At", dateTimeFormatter.format(task.acceptedAt)], ["Started At", task.startedAt ? dateTimeFormatter.format(task.startedAt) : null], ["Completed At", task.completedAt ? dateTimeFormatter.format(task.completedAt) : null]]} /></section>
      </div>
      <section className="mt-6 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-lg font-semibold">Task Photos</h2>
        <p className="mt-2 text-sm text-muted">Photos are private while awaiting admin review.</p>
        {task.photos.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{task.photos.map((photo) => <article key={photo.id} className="overflow-hidden rounded-2xl border border-border"><Image unoptimized src={`/task-photos/${photo.id}`} alt={photo.caption || "Task photo"} width={640} height={480} className="aspect-[4/3] w-full object-cover" /><div className="p-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${photo.isApprovedForPublic ? "bg-primary/25 text-foreground" : "bg-light-background text-muted"}`}>{photo.isApprovedForPublic ? "Approved for Public Use" : "Pending Review"}</span><p className="mt-3 text-sm text-foreground">{photo.caption || "No caption"}</p><p className="mt-2 text-xs text-muted">Uploaded {dateTimeFormatter.format(photo.uploadedAt)}</p></div></article>)}</div> : <p className="mt-5 rounded-xl bg-light-background p-5 text-sm text-muted">No task photos uploaded yet.</p>}
        {task.photosSubmittedAt ? <div className="mt-5 rounded-xl border border-primary/40 bg-primary/10 p-4"><p className="font-semibold">Photos Submitted for Review</p><p className="mt-1 text-sm text-muted">Confirmed {dateTimeFormatter.format(task.photosSubmittedAt)}. Photos remain private unless an admin approves them individually.</p></div> : task.photos.length > 0 ? <div className="mt-5"><TaskAction action={submitPhotosForReview.bind(null, task.id)} label="Submit Photos for Review" confirmation="Confirm that this photo set is ready for Admin review? This does not publish or approve any photo." /></div> : null}
        <TaskPhotoUpload action={uploadTaskPhoto.bind(null, task.id)} />
        <div className="mt-5 flex flex-wrap gap-3"><Link href="/employee/my-tasks" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-primary">Back to My Tasks</Link><Link href="/employee" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-primary">Back to Dashboard</Link></div>
      </section>
    </div>
  );
}
