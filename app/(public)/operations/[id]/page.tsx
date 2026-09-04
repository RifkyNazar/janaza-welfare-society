import type { Metadata } from "next";
import Image from "next/image";
import { BackButton } from "@/components/back-button";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Operation | Janaza Welfare Society" };
export const dynamic = "force-dynamic";
const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" });

export default async function OperationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const value = (await params).id;
  if (!/^\d+$/.test(value)) notFound();
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const operation = await prisma.operation.findFirst({ where: { id, isPublished: true }, select: { title: true, description: true, shortDescription: true, serviceType: true, area: true, operationDate: true, photos: { where: { taskPhoto: { isApprovedForPublic: true } }, orderBy: { displayOrder: "asc" }, select: { id: true, taskPhoto: { select: { caption: true } } } } } });
  if (!operation) notFound();
  return <article className="bg-light-background px-6 py-12 sm:py-16"><div className="mx-auto max-w-4xl"><BackButton fallbackHref="/operations" /><header className="mt-7 rounded-3xl border border-border bg-white p-6 sm:p-10"><p className="text-sm font-semibold text-primary">{operation.serviceType}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{operation.title}</h1><p className="mt-4 text-sm text-muted">{operation.area} {"\u00b7"} {date.format(operation.operationDate)}</p><p className="mt-6 text-lg leading-8 text-muted">{operation.shortDescription}</p></header>{operation.photos.length > 0 && <div className="mt-7 grid gap-5 sm:grid-cols-2">{operation.photos.map((photo) => <figure key={photo.id} className="overflow-hidden rounded-2xl border border-border bg-white"><Image unoptimized src={`/operation-photos/${photo.id}`} alt={photo.taskPhoto.caption || "Operation photo"} width={1000} height={750} className="aspect-[4/3] w-full object-cover" />{photo.taskPhoto.caption && <figcaption className="p-4 text-sm text-muted">{photo.taskPhoto.caption}</figcaption>}</figure>)}</div>}<section className="mt-7 rounded-3xl border border-border bg-white p-6 sm:p-10"><h2 className="text-2xl font-semibold">About this operation</h2><p className="mt-5 whitespace-pre-wrap leading-8 text-muted">{operation.description || operation.shortDescription}</p></section></div></article>;
}
