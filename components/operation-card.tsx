import Image from "next/image";
import Link from "next/link";

export type PublicOperationCard = { id: number; title: string; shortDescription: string; serviceType: string; area: string; operationDate: Date; photos: Array<{ id: number }> };
const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

export function OperationCard({ operation }: { operation: PublicOperationCard }) {
  const photo = operation.photos[0];
  return <article className="h-full overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_30px_rgba(16,42,42,0.06)]"><div className="aspect-[16/9] overflow-hidden border-b border-border bg-light-background">{photo ? <Image unoptimized src={`/operation-photos/${photo.id}`} alt="" width={800} height={450} className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-sm font-semibold text-muted">Janaza Welfare Society</div>}</div><div className="p-6"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{operation.serviceType}</p><h2 className="mt-2 text-xl font-semibold text-foreground">{operation.title}</h2><p className="mt-2 text-sm text-muted">{operation.area} · {date.format(operation.operationDate)}</p><p className="mt-4 line-clamp-3 leading-7 text-muted">{operation.shortDescription}</p><Link href={`/operations/${operation.id}`} className="mt-5 inline-flex text-sm font-semibold underline decoration-primary decoration-2 underline-offset-4">View Details</Link></div></article>;
}
