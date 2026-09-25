import type { Metadata } from "next";
import Link from "next/link";
import { TaskStatusBadge } from "@/components/employee/task-status-badge";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";

export const metadata: Metadata = { title: "My Tasks" };
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function MyTasksPage() {
  const session = await requireEmployee();
  const profileId = session.user.employeeProfileId;
  const tasks = profileId ? await prisma.taskAssignment.findMany({
    where: { employeeId: profileId, isActive: true, status: { in: ["ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS"] } },
    orderBy: { assignedAt: "desc" },
    select: { id: true, status: true, acceptedAt: true, request: { select: { requestCode: true, serviceType: true, area: true, requiredDate: true } } },
  }) : [];

  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-semibold text-primary">My Work</p><h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">My Tasks</h1><p className="mt-2 text-sm text-muted">Your assigned and in-progress service tasks.</p>
      <section className="mt-8 space-y-4">
        {tasks.length === 0 ? <div className="rounded-2xl border border-border bg-white px-6 py-14 text-center"><p className="font-semibold">No active tasks</p><p className="mt-2 text-sm text-muted">Assigned work will appear here.</p></div> : tasks.map((task) => (
          <article key={task.id} className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_26px_rgba(16,42,42,0.035)]">
            <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center">
              <div><p className="text-xs font-semibold text-primary">{task.request.requestCode}</p><p className="mt-1 font-semibold">{task.request.serviceType}</p><p className="mt-1 text-sm text-muted">{task.request.area}</p></div>
              <div><TaskStatusBadge status={task.status} /><p className="mt-2 text-xs text-muted">Accepted {dateFormatter.format(task.acceptedAt)}</p><p className="mt-1 text-xs text-muted">Required {dateFormatter.format(task.request.requiredDate)}</p></div>
              <Link href={`/employee/my-tasks/${task.id}`} className="min-h-11 rounded-xl border border-border px-4 py-2.5 text-center text-sm font-semibold hover:border-primary hover:bg-light-background">View Task</Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
