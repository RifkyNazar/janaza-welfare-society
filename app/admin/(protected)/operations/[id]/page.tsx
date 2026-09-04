import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OperationForm } from "@/components/admin/operation-form";
import { OperationPublishAction } from "@/components/admin/operation-publish-action";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { setOperationPublished, updateOperation } from "../actions";

export const metadata: Metadata = { title: "Manage Operation" };
const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

export default async function AdminOperationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const value = (await params).id;
  if (!/^\d+$/.test(value)) notFound();
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const operation = await prisma.operation.findUnique({
    where: { id },
    select: {
      id: true, title: true, shortDescription: true, description: true,
      serviceType: true, area: true, operationDate: true, isPublished: true,
      publishedAt: true, taskAssignmentId: true,
      taskAssignment: {
        select: {
          request: { select: { requestCode: true } },
          photos: { select: { id: true, caption: true, isApprovedForPublic: true }, orderBy: { uploadedAt: "asc" } },
        },
      },
      photos: {
        select: { id: true, taskPhotoId: true, displayOrder: true, taskPhoto: { select: { caption: true, isApprovedForPublic: true } } },
        orderBy: { displayOrder: "asc" },
      },
    },
  });
  if (!operation) notFound();
  const selected = new Set(operation.photos.map((photo) => photo.taskPhotoId));
  const approvedPhotos = operation.taskAssignment?.photos.filter((photo) => photo.isApprovedForPublic).map((photo) => ({ id: photo.id, caption: photo.caption, selected: selected.has(photo.id) })) ?? [];
  const unavailable = operation.photos.filter((photo) => !photo.taskPhoto.isApprovedForPublic);
  return <div className="mx-auto max-w-6xl"><Link href="/admin/operations" className="text-sm font-semibold text-muted underline decoration-primary decoration-2 underline-offset-4">Back to Operations</Link><div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row"><div><p className="text-sm font-semibold text-primary">{operation.taskAssignment?.request.requestCode ?? "Standalone operation"}</p><h1 className="mt-1 text-3xl font-semibold">{operation.title}</h1><p className="mt-2 text-sm text-muted">{operation.isPublished ? `Published ${operation.publishedAt ? date.format(operation.publishedAt) : ""}` : "Private draft"}</p></div><OperationPublishAction published={operation.isPublished} action={setOperationPublished.bind(null, id, !operation.isPublished)} /></div>
  {unavailable.length > 0 && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{unavailable.length} selected photo{unavailable.length === 1 ? " is" : "s are"} no longer approved. {operation.isPublished ? "They are hidden from public pages immediately." : "Remove them or restore approval before publishing."}</div>}
  {operation.photos.length > 0 && <section className="mt-6 rounded-2xl border border-border bg-white p-5"><h2 className="text-lg font-semibold">Selected Photos</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{operation.photos.map((photo) => <div key={photo.id} className="overflow-hidden rounded-xl border border-border"><Image unoptimized src={`/task-photos/${photo.taskPhotoId}`} alt={photo.taskPhoto.caption || "Selected operation photo"} width={640} height={480} className="aspect-[4/3] w-full object-cover" /><div className="p-3"><p className="text-sm">{photo.taskPhoto.caption || "No caption"}</p><p className={`mt-2 text-xs font-semibold ${photo.taskPhoto.isApprovedForPublic ? "text-emerald-800" : "text-amber-800"}`}>{photo.taskPhoto.isApprovedForPublic ? "Approved" : "No longer approved"}</p></div></div>)}</div></section>}
  <OperationForm action={updateOperation.bind(null, id)} submitLabel="Save Changes" initial={{ title: operation.title, shortDescription: operation.shortDescription, description: operation.description ?? "", serviceType: operation.serviceType, area: operation.area, operationDate: operation.operationDate.toISOString().slice(0, 10) }} photos={approvedPhotos} /></div>;
}
