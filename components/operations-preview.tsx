import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

export async function OperationsPreview() {
  const operations = await prisma.operation.findMany({
    where: { isPublished: true }, orderBy: { operationDate: "desc" }, take: 3,
    select: { id: true, title: true, shortDescription: true, serviceType: true, area: true, operationDate: true,
      photos: { where: { taskPhoto: { isApprovedForPublic: true } }, orderBy: { displayOrder: "asc" }, take: 1, select: { id: true } },
    },
  });

  return <section aria-labelledby="operations-preview-title" className="bg-foreground px-6 py-16 text-white sm:py-24">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Latest operations</p><h2 id="operations-preview-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Care, delivered in the community.</h2></div>
        <Link href="/operations" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start border-b border-primary pb-1 text-sm font-semibold sm:self-auto">View all activity <span aria-hidden="true">→</span></Link>
      </div>
      <p className="mt-5 max-w-2xl leading-7 text-white/65">Recent service updates using only photos reviewed and approved for public display.</p>
      {operations.length ? <div className="mt-10 grid gap-5 md:grid-cols-3">{operations.map((operation) =>
        <Link key={operation.id} href={`/operations/${operation.id}`} className="group overflow-hidden rounded-3xl border border-white/15 bg-white/[0.06] transition hover:-translate-y-1 hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:transform-none">
          <div className="relative aspect-[16/10] overflow-hidden bg-primary/10">
            {operation.photos[0] ? <Image unoptimized src={`/operation-photos/${operation.photos[0].id}`} alt={`${operation.title} — approved public service photo`} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transition-none" /> : <div className="home-operation-placeholder size-full" aria-label="No approved public photo available" />}
            <span className="absolute left-4 top-4 rounded-full bg-foreground/85 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-primary backdrop-blur-sm">{operation.serviceType}</span>
          </div>
          <div className="p-5 sm:p-6"><p className="text-xs text-white/55">{date.format(operation.operationDate)} · {operation.area}</p><h3 className="mt-2 text-xl font-semibold leading-snug">{operation.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-white/65">{operation.shortDescription}</p><span className="mt-5 inline-flex text-sm font-semibold text-primary">View activity →</span></div>
        </Link>)}</div> : <div className="mt-10 rounded-3xl border border-white/15 px-6 py-12 text-center"><p className="font-semibold">Approved service activity will appear here.</p><p className="mt-2 text-sm text-white/60">There are no public operation updates yet.</p></div>}
    </div>
  </section>;
}
