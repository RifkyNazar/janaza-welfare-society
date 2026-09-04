import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireEmployee } from "@/lib/permissions";

export const metadata: Metadata = { title: "Completed Tasks" };
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function CompletedTasksPage() {
  const session = await requireEmployee();
  const profileId = session.user.employeeProfileId;
  const tasks = profileId ? await prisma.taskAssignment.findMany({ where: { employeeId: profileId, status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { id: true, acceptedAt: true, completedAt: true, request: { select: { requestCode: true, serviceType: true, area: true } } } }) : [];

  return <div className="mx-auto max-w-7xl"><p className="text-sm font-semibold text-primary">History</p><h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Completed Tasks</h1><p className="mt-2 text-sm text-muted">Your completed service assignments.</p><section className="mt-8 space-y-4">{tasks.length === 0 ? <div className="rounded-2xl border border-border bg-white px-6 py-14 text-center text-sm text-muted">No completed tasks yet.</div> : tasks.map((task) => <article key={task.id} className="rounded-2xl border border-border bg-white p-5"><div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center"><div><p className="text-xs font-semibold text-primary">{task.request.requestCode}</p><p className="mt-1 font-semibold">{task.request.serviceType}</p><p className="mt-1 text-sm text-muted">{task.request.area}</p></div><div className="text-xs text-muted"><p>Accepted {dateFormatter.format(task.acceptedAt)}</p><p className="mt-1">Completed {task.completedAt ? dateFormatter.format(task.completedAt) : "—"}</p></div><Link href={`/employee/my-tasks/${task.id}`} className="min-h-11 rounded-xl border border-border px-4 py-2.5 text-center text-sm font-semibold hover:border-primary hover:bg-light-background">View Details</Link></div></article>)}</section></div>;
}
