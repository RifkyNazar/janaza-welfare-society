"use client";
import { T, useTranslation } from "@/components/public-language";
import Image from "next/image";
import Link from "next/link";
import { MotionControls, useShowcaseMotion } from "@/components/use-showcase-motion";
type Banner = {
    id: string;
    title: string;
    imageUrl: string;
    description: string | null;
};
export function AdvertisementCarousel({ banners }: {
    banners: Banner[];
}) {
    const m = useShowcaseMotion(banners.length);
    const { t } = useTranslation();
    if (!banners.length)
        return null;
    return <div className="mx-auto max-w-7xl" {...m.interaction}><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="jws-eyebrow"><T text="From our community" /></p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"><T text="Community notices" /></h2></div><MotionControls motion={m} count={banners.length} label="Community notices"/></div><div className="glass-panel overflow-hidden rounded-[1.75rem]">{banners.map((b, i) => <article hidden={i !== m.index} key={b.id} className="notice-slide"><Link href={'/advertisements/' + b.id} className="block bg-white"><Image unoptimized src={'/advertisement-images/' + b.imageUrl} alt={b.title} width={1600} height={700} className="h-[240px] w-full object-contain sm:h-[360px]"/></Link><div className="flex min-h-32 flex-wrap items-center justify-between gap-3 border-t border-border p-5"><div className="min-w-0 flex-1"><h3 className="line-clamp-1 font-semibold">{b.title}</h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{b.description}</p></div><Link href={'/advertisements/' + b.id} className="jws-text-link"><T text="View notice" /> &#8599;</Link></div></article>)}</div><div className="mt-2 flex flex-wrap justify-center">{banners.length > 1 && banners.map((b, i) => <button type="button" key={b.id} onClick={() => m.setIndex(i)} aria-label={t("Show {title}").replace("{title}", () => b.title)} aria-current={i === m.index ? 'true' : undefined} className="flex size-11 items-center justify-center"><span className={'h-1.5 rounded-full ' + (i === m.index ? 'w-6 bg-foreground' : 'w-2 bg-foreground/20')}/></button>)}</div></div>;
}
