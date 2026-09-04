import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { completeTask, startTask } from "@/app/employee/(protected)/actions";
import { TaskAction } from "@/components/employee/task-action";
import { TaskStatusBadge } from "@/components/employee/task-status-badge";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";

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
    where: { id, employeeId: profileId },
    include: { request: true },
  });
  if (!task) notFound();
  const request = task.request;
  const locationUrl = safeUrl(request.locationLink);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href={task.status === "COMPLETED" ? "/employee/completed" : "/employee/my-tasks"} className="text-sm font-semibold text-muted underline decoration-primary decoration-2 underline-offset-4 hover:text-foreground">Back to Tasks</Link>
      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-sm font-semibold text-primary">{request.requestCode}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{request.serviceType}</h1><div className="mt-3"><TaskStatusBadge status={task.status} /></div></div><div>{task.status === "ASSIGNED" && <TaskAction action={startTask.bind(null, task.id)} label="Start Task" />}{task.status === "IN_PROGRESS" && <TaskAction action={completeTask.bind(null, task.id)} label="Complete Task" confirmation="Complete this task? This will mark the service request as completed." />}</div></div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Request</h2><Details items={[["Request Code", request.requestCode], ["Service Type", request.serviceType], ["Required Date", dateFormatter.format(request.requiredDate)], ["Required Time", request.requiredTime], ["Place Type", request.placeType], ["Note", request.note]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Requester</h2><Details items={[["Name", request.requesterName], ["Mobile Number", request.mobileNumber], ["Alternative Number", request.alternativeNumber], ["Relationship", request.relationshipToDeceased]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Location</h2><Details items={[["Address", request.address], ["Area", request.area], ["Location Link", locationUrl ? <a key="map" href={locationUrl} target="_blank" rel="noreferrer" className="font-semibold underline decoration-primary decoration-2 underline-offset-4">Open location</a> : null], ["Hospital Name", request.hospitalName]]} /></section>
        <section className="rounded-2xl border border-border bg-white p-6"><h2 className="text-lg font-semibold">Task</h2><Details items={[["Task Status", task.status.replaceAll("_", " ")], ["Accepted At", dateTimeFormatter.format(task.acceptedAt)], ["Started At", task.startedAt ? dateTimeFormatter.format(task.startedAt) : null], ["Completed At", task.completedAt ? dateTimeFormatter.format(task.completedAt) : null]]} /></section>
      </div>
    </div>
  );
}
