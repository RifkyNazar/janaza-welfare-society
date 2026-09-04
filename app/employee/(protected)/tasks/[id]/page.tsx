import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { acceptTask } from "@/app/employee/(protected)/actions";
import { TaskAction } from "@/components/employee/task-action";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";

export const metadata: Metadata = { title: "Available Task Details" };
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function AvailableTaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireEmployee();
  const { id: value } = await params;
  if (!/^\d+$/.test(value)) notFound();
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const request = await prisma.serviceRequest.findFirst({
    where: { id, status: "NEW", taskAssignment: null },
    select: { id: true, requestCode: true, serviceType: true, requiredDate: true, requiredTime: true, area: true, placeType: true, hospitalName: true, note: true },
  });
  if (!request) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/employee/tasks" className="text-sm font-semibold text-muted underline decoration-primary decoration-2 underline-offset-4 hover:text-foreground">Back to Available Tasks</Link>
      <div className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)] sm:p-8">
        <p className="text-sm font-semibold text-primary">{request.requestCode}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{request.serviceType}</h1>
        <dl className="mt-7 grid gap-5 sm:grid-cols-2">
          {[["Required Date", dateFormatter.format(request.requiredDate)], ["Required Time", request.requiredTime || "Not specified"], ["Area", request.area], ["Place Type", request.placeType], ["Hospital", request.hospitalName || "Not applicable"]].map(([label, content]) => <div key={label} className="rounded-xl border border-border bg-light-background p-4"><dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt><dd className="mt-2 text-sm font-medium">{content}</dd></div>)}
        </dl>
        <div className="mt-5 rounded-xl border border-border p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted">General Note</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{request.note || "No note provided."}</p></div>
        <p className="mt-5 text-xs leading-5 text-muted">Private requester contact and exact location details become available after you accept this task.</p>
        <div className="mt-6"><TaskAction action={acceptTask.bind(null, request.id)} label="Accept Task" /></div>
      </div>
    </div>
  );
}
