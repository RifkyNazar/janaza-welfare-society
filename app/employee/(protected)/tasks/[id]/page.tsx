import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { acceptTask } from "@/app/employee/(protected)/actions";
import { TaskAction } from "@/components/employee/task-action";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";
import { categoryLabel, serviceSummary } from "@/lib/service-options";

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
    select: { id: true, requestCode: true, serviceType: true, serviceCategory: true, serviceSelections: { select: { serviceLabel: true }, orderBy: { id: "asc" } }, area: true, createdAt: true },
  });
  if (!request) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <BackButton fallbackHref="/employee/tasks" />
      <div className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_rgba(16,42,42,0.04)] sm:p-8">
        <p className="text-sm font-semibold text-primary">{request.requestCode}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{categoryLabel(request.serviceCategory)}</h1>
        <dl className="mt-7 grid gap-5 sm:grid-cols-2">
          {[["Selected Services", serviceSummary(request.serviceType, request.serviceSelections)], ["Area", request.area], ["Status", "New"], ["Submitted", dateFormatter.format(request.createdAt)]].map(([label, content]) => <div key={label} className="rounded-xl border border-border bg-light-background p-4"><dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt><dd className="mt-2 text-sm font-medium">{content}</dd></div>)}
        </dl>
        <p className="mt-5 text-xs leading-5 text-muted">Private requester contact and exact location details become available after you accept this task.</p>
        <div className="mt-6"><TaskAction action={acceptTask.bind(null, request.id)} label="Accept Task" /></div>
      </div>
    </div>
  );
}
