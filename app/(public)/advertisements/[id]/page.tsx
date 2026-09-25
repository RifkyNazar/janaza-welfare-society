import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { advertisementImageExists } from "@/lib/advertisement-image-storage";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Advertisement | Janaza Welfare Society" };

export default async function PublicAdvertisementPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  if (!id || id.length > 191) notFound();
  const now = new Date();
  const advertisement = await prisma.advertisement.findFirst({
    where: { id, isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
    select: { title: true, description: true, imageUrl: true },
  });
  if (!advertisement || !(await advertisementImageExists(advertisement.imageUrl))) notFound();

  return <main className="bg-light-background px-4 py-10 sm:px-8 sm:py-14"><article className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border bg-white shadow-[0_16px_45px_rgba(16,42,42,.08)]"><Image unoptimized src={`/advertisement-images/${advertisement.imageUrl}`} alt={advertisement.title} width={1600} height={700} className="h-auto max-h-[70vh] w-full object-contain bg-white"/><div className="p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">JWS Advertisement</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{advertisement.title}</h1>{advertisement.description&&<p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted sm:text-base">{advertisement.description}</p>}<Link href="/" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">Back to Home</Link></div></article></main>;
}
