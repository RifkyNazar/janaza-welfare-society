import { getPortalTranslation } from "@/lib/portal-language";
import { T } from "@/components/public-language";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { notFound } from "next/navigation";
import { OperationForm } from "@/components/admin/operation-form";
import { OperationPublishAction } from "@/components/admin/operation-publish-action";
import { StatusMessage } from "@/components/status-message";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { setOperationPublished, updateOperation } from "../actions";
import { MediaForm } from "@/components/admin/media-form";

export const metadata: Metadata = { title: "Manage Operation" };


export default async function AdminOperationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; photoRemoved?: string }> }) {
  const { dateLocale } = await getPortalTranslation();
  const date = new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium" });
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
      publishedAt: true, taskAssignmentId: true, source: true,
      media: { orderBy: [{ displayOrder: "asc" }, { id: "asc" }], select: { id: true, altText: true, caption: true, displayOrder: true, isPublic: true } },
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
  const parameters = await searchParams;
  const created = parameters.created === "1";
  const photoRemoved = parameters.photoRemoved === "1";
  const selected = new Set(operation.photos.map((photo) => photo.taskPhotoId));
  const approvedPhotos = operation.taskAssignment?.photos.filter((photo) => photo.isApprovedForPublic).map((photo) => ({ id: photo.id, caption: photo.caption, selected: selected.has(photo.id) })) ?? [];
  const unavailable = operation.photos.filter((photo) => !photo.taskPhoto.isApprovedForPublic);
  return <div className="mx-auto max-w-6xl"><BackButton fallbackHref="/admin/operations" /><div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row"><div><p className="text-sm font-semibold text-primary">{operation.taskAssignment?.request.requestCode ?? <T text="Standalone operation" />}</p><h1 className="mt-1 text-3xl font-semibold">{operation.title}</h1><p className="mt-2 text-sm text-muted">{operation.isPublished ? <><T text="Published" /> {operation.publishedAt && date.format(operation.publishedAt)}</> : <T text="Private draft" />}</p></div><OperationPublishAction published={operation.isPublished} action={setOperationPublished.bind(null, id, !operation.isPublished)} /></div>
  {created && <StatusMessage className="mt-6"><T text={operation.source === "MANUAL" ? "Draft saved. Upload your activity photos below, then review before publishing." : "Operation created successfully."} /></StatusMessage>}
  {created && <div className="mt-3 flex flex-wrap gap-3"><Link href="/admin/operations" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold"><T text="Back to Operations" /></Link><Link href="/admin" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold"><T text="Dashboard" /></Link><Link href="/operations" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold"><T text="View Website" /></Link></div>}
  {unavailable.length > 0 && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{unavailable.length} <T text="selected photo" />{unavailable.length === 1 ? " is" : "s are"} <T text="no longer approved." /> <T text={operation.isPublished ? "They are hidden from public pages immediately." : "Remove them or restore approval before publishing."} /></div>}
  {operation.photos.length > 0 && <section className="mt-6 rounded-2xl border border-border bg-white p-5"><h2 className="text-lg font-semibold"><T text="Selected Photos" /></h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{operation.photos.map((photo) => <div key={photo.id} className="overflow-hidden rounded-xl border border-border"><Image unoptimized src={`/task-photos/${photo.taskPhotoId}`} alt={photo.taskPhoto.caption || "Selected operation photo"} width={640} height={480} className="aspect-[4/3] w-full object-cover" /><div className="p-3"><p className="text-sm">{photo.taskPhoto.caption || <T text="No caption" />}</p><p className={`mt-2 text-xs font-semibold ${photo.taskPhoto.isApprovedForPublic ? "text-emerald-800" : "text-amber-800"}`}><T text={photo.taskPhoto.isApprovedForPublic ? "Approved" : "No longer approved"} /></p></div></div>)}</div></section>}
  {operation.source === "MANUAL" && !operation.taskAssignmentId && <section id="activity-photos" aria-labelledby="activity-photos-heading" className="mt-8 scroll-mt-8 rounded-3xl border border-primary/20 bg-light-background p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary"><T text="Photos & publication" /></p><h2 id="activity-photos-heading" className="mt-2 text-2xl font-semibold"><T text="Activity Photos" /></h2></div><span className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold">{operation.media.length} <T text="photo" />{operation.media.length === 1 ? "" : "s"}</span></div><p className="mt-3 text-sm leading-7 text-muted"><T text={operation.isPublished ? "This activity is published. Only photos selected for publication are publicly accessible." : "This activity is a private draft. All uploaded photos stay private until you select them and publish the activity."} /></p>{photoRemoved && <StatusMessage className="mt-4"><T text="Photo removed successfully." /></StatusMessage>}<MediaForm kind="activity" operationId={id} />{operation.media.length > 0 ? <div className="grid items-start gap-5 lg:grid-cols-2">{operation.media.map(media => <MediaForm key={media.id} kind="activity" operationId={id} media={{ ...media, enabled: media.isPublic }} />)}</div> : <p className="rounded-xl border border-dashed border-border bg-white p-5 text-center text-sm text-muted"><T text="No activity photos yet. Use Upload Photos above to add the first photo." /></p>}</section>}
  <OperationForm manual={operation.source === "MANUAL" && !operation.taskAssignmentId} action={updateOperation.bind(null, id)} submitLabel="Save Changes" initial={{ title: operation.title, shortDescription: operation.shortDescription, description: operation.description ?? "", serviceType: operation.serviceType, area: operation.area, operationDate: operation.operationDate.toISOString().slice(0, 10) }} photos={approvedPhotos} />
</div>;
}
