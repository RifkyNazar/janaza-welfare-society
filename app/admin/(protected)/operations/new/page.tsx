import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OperationForm } from "@/components/admin/operation-form";
import { BackButton } from "@/components/back-button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { createOperation } from "../actions";

export const metadata: Metadata = { title: "Create Public Operation" };

export default async function NewOperationPage({ searchParams }: { searchParams: Promise<{ taskId?: string }> }) {
  await requireAdmin();
  const value = (await searchParams).taskId ?? "";
  if (!/^\d+$/.test(value)) notFound();
  const taskId = Number(value);
  if (!Number.isSafeInteger(taskId) || taskId <= 0) notFound();
  const task = await prisma.taskAssignment.findFirst({
    where: { id: taskId, status: "COMPLETED", request: { is: { status: "COMPLETED" } } },
    select: { completedAt: true, operation: { select: { id: true } }, request: { select: { serviceType: true, area: true, requiredDate: true } }, photos: { where: { isApprovedForPublic: true }, select: { id: true, caption: true }, orderBy: { uploadedAt: "asc" } } },
  });
  if (!task) notFound();
  if (task.operation) redirect(`/admin/operations/${task.operation.id}`);
  const operationDate = (task.completedAt ?? task.request.requiredDate).toISOString().slice(0, 10);
  return <div className="mx-auto max-w-5xl"><BackButton fallbackHref="/admin/task-assignments" /><div className="mt-6"><p className="text-sm font-semibold text-primary">Draft workflow</p><h1 className="mt-1 text-3xl font-semibold">Create Public Operation</h1><p className="mt-2 text-sm text-muted">Review and write only information suitable for public viewing. Saving creates a private draft.</p></div><OperationForm action={createOperation.bind(null, taskId)} submitLabel="Create Draft" initial={{ title: "", shortDescription: "", description: "", serviceType: task.request.serviceType, area: task.request.area, operationDate }} photos={task.photos} /></div>;
}
