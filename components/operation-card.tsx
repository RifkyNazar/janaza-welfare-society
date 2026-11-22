import { T } from "@/components/public-language";
import { publicOperationImages } from "@/lib/public-operations";
import Image from "next/image";
import Link from "next/link";

import type { PublicOperation } from "@/lib/public-operations";
export type PublicOperationCard = PublicOperation;
const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

export function OperationCard({ operation }: { operation: PublicOperationCard }) {
  const photo = publicOperationImages(operation)[0];
  return <article className="jws-activity-card flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_30px_rgba(16,42,42,0.06)]"><div className="aspect-[16/9] shrink-0 overflow-hidden border-b border-border bg-light-background">{photo ? <Image unoptimized src={photo.src} alt={photo.altText} width={800} height={450} loading="lazy" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-sm font-semibold text-muted"><T text="Janaza Welfare Society" /></div>}</div><div className="flex flex-1 flex-col p-6"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{operation.serviceType}</p><h2 className="mt-2 text-xl font-semibold text-foreground">{operation.title}</h2><p className="mt-2 text-sm text-muted">{operation.area} · {date.format(operation.operationDate)}</p><p className="mt-4 line-clamp-3 leading-7 text-muted">{operation.shortDescription}</p><Link href={`/operations/${operation.id}`} className="mt-auto inline-flex min-h-11 items-center pt-4 text-sm font-semibold underline decoration-primary decoration-2 underline-offset-4"><T text="View Details" /></Link></div></article>;
}
