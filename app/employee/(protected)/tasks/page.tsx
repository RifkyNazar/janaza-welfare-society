import type { Metadata } from "next";
import Link from "next/link";
import { acceptTask } from "@/app/employee/(protected)/actions";
import { TaskAction } from "@/components/employee/task-action";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";

export const metadata: Metadata = { title: "Available Tasks" };
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function AvailableTasksPage() {
  await requireEmployee();
  const requests = await prisma.serviceRequest.findMany({
    where: { status: "NEW", taskAssignment: null },
    orderBy: [{ requiredDate: "asc" }, { createdAt: "asc" }],
    select: { id: true, requestCode: true, serviceType: true, area: true, requiredDate: true, requiredTime: true, placeType: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-semibold text-primary">Task Board</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Available Tasks</h1>
      <p className="mt-2 text-sm text-muted">New requests available for acceptance. Requester details remain limited until assignment.</p>

      <section className="mt-8 space-y-4">
        {requests.length === 0 ? <div className="rounded-2xl border border-border bg-white px-6 py-14 text-center"><p className="font-semibold">No tasks are currently available</p><p className="mt-2 text-sm text-muted">New requests will appear here.</p></div> : requests.map((request) => (
          <article key={request.id} className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_26px_rgba(16,42,42,0.035)]">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center">
              <div><p className="text-xs font-semibold text-primary">{request.requestCode}</p><p className="mt-1 font-semibold">{request.serviceType}</p><p className="mt-1 text-sm text-muted">{request.area}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Required</p><p className="mt-1 text-sm">{dateFormatter.format(request.requiredDate)}</p><p className="mt-1 text-xs text-muted">{request.requiredTime || "Time not specified"}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Place</p><p className="mt-1 text-sm">{request.placeType}</p><p className="mt-1 text-xs text-muted">Created {dateFormatter.format(request.createdAt)}</p></div>
              <div className="flex flex-wrap gap-2"><Link href={`/employee/tasks/${request.id}`} className="min-h-11 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-primary hover:bg-light-background">View Details</Link><TaskAction action={acceptTask.bind(null, request.id)} label="Accept Task" /></div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
