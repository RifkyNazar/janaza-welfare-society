import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdvertisementForm } from "@/components/admin/advertisement-form";
import { saveAdvertisement } from "../actions";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { advertisementImageExists } from "@/lib/advertisement-image-storage";

const local = (date: Date | null) => date ? new Date(date.getTime() + 330 * 60_000).toISOString().slice(0, 16) : "";

export default async function AdvertisementDetails({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const id = (await params).id;
  if (!id || id.length > 191) notFound();
  const advertisement = await prisma.advertisement.findUnique({ where: { id } });
  if (!advertisement) notFound();
  const hasImage = await advertisementImageExists(advertisement.imageUrl);
  const created = (await searchParams).created === "1";

  return <div className="mx-auto max-w-4xl">
    <Link href="/admin/advertisements" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold">Back to Advertisements</Link>
    {created && <p role="status" aria-live="polite" className="mt-5 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm font-semibold">✓ Advertisement created successfully.</p>}
    <h1 className="mt-6 text-3xl font-semibold">{advertisement.title}</h1>
    <section id="preview" className="mt-5 rounded-2xl border border-border bg-light-background p-4 sm:p-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-muted">Homepage Preview</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_28px_rgba(16,42,42,.06)]">
        {hasImage ? <Image unoptimized src={`/advertisement-images/${advertisement.imageUrl}`} alt={advertisement.title} width={1200} height={400} className="aspect-[3/1] min-h-32 w-full object-cover"/> : <p className="p-8 text-center text-sm font-semibold text-muted">The original upload is missing. Choose the banner image again below.</p>}
        {advertisement.description && <p className="p-4 text-sm text-muted">{advertisement.description}</p>}
      </div>
    </section>
    <AdvertisementForm action={saveAdvertisement.bind(null, advertisement.id)} initial={{ title: advertisement.title, description: advertisement.description ?? "", startsAt: local(advertisement.startsAt), endsAt: local(advertisement.endsAt), displayOrder: advertisement.displayOrder, isActive: advertisement.isActive, hasImage, imageUrl: hasImage ? `/advertisement-images/${advertisement.imageUrl}` : undefined }}/>
  </div>;
}
