import { TaskAction } from "@/components/employee/task-action";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { OperationForm } from "@/components/admin/operation-form";
import { BackButton } from "@/components/back-button";
import { T } from "@/components/public-language";
import { deleteOperation, updateOperation } from "../actions";

export default async function ManageOperationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const operation = await prisma.operation.findUnique({ where: { id } });
  if (!operation) notFound();
  return <div className="mx-auto max-w-3xl"><BackButton fallbackHref="/admin/operations" />
    <h1 className="mt-5 text-3xl font-semibold">{operation.title}</h1>
    {!operation.isPublished && <p className="mt-2 text-muted"><T text="Private activity" /></p>}
    <OperationForm replacePhoto={operation.source === "MANUAL" && !operation.taskAssignmentId} action={updateOperation.bind(null, id)} initial={{ title: operation.title, description: operation.description ?? operation.shortDescription }} />
    <div className="mt-6"><TaskAction action={deleteOperation.bind(null, id)} label="Delete operation" confirmation="Delete this operation and its uploaded photos?" /></div>
  </div>;
}
