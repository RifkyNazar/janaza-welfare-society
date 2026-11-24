"use client";

import Image from "next/image";
import Link from "next/link";
import { T, useTranslation } from "@/components/public-language";
import { useAdvertisementExpiry } from "@/components/advertisement-expiry";
import { LoopingCardRail } from "@/components/looping-card-rail";

type Banner = { id: string; title: string; imageUrl: string; description: string | null; expiresAt: number | null };

export function AdvertisementCarousel({ banners }: { banners: Banner[] }) {
  const { t } = useTranslation();
  const expiredThrough = useAdvertisementExpiry(banners.map(banner => banner.expiresAt));
  const visible = banners.filter(banner => banner.expiresAt === null || banner.expiresAt > expiredThrough);
  const cards = (repeat = false) => visible.map(banner => <article key={banner.id}
    className="overflow-hidden rounded-2xl border border-border bg-white">
    <Link href={`/advertisements/${banner.id}`} tabIndex={repeat ? -1 : undefined} prefetch={false} className="flex h-[clamp(11rem,36vw,20rem)] items-center justify-center bg-light-background">
      <Image unoptimized src={`/advertisement-images/${banner.imageUrl}`} alt={banner.title} width={800} height={600} className="h-full w-full object-contain" />
    </Link>
    <div className="border-t border-border p-4">
      <h3 className="break-words font-semibold text-foreground">{banner.title}</h3>
      {banner.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{banner.description}</p>}
      <Link href={`/advertisements/${banner.id}`} tabIndex={repeat ? -1 : undefined} prefetch={false} className="mt-2 inline-flex min-h-11 items-center font-semibold text-foreground underline underline-offset-4"><T text="View notice" /></Link>
    </div>
  </article>);
  if (!visible.length) return null;
  return <section aria-label={t("Community notices")} className="bg-white px-4 py-7 text-foreground sm:px-8">
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-5 text-2xl font-semibold text-foreground sm:text-3xl"><T text="Community notices" /></h2>
      <LoopingCardRail label={t("Community notices")} count={visible.length} repeat={cards(true)}>{cards()}</LoopingCardRail>
    </div>
  </section>;
}
