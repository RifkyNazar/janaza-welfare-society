import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

export async function OperationsPreview() {
  const operations = await prisma.operation.findMany({
    where: { isPublished: true },
    orderBy: { operationDate: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      shortDescription: true,
      serviceType: true,
      area: true,
      operationDate: true,
      photos: {
        where: { taskPhoto: { isApprovedForPublic: true } },
        orderBy: { displayOrder: "asc" },
        take: 1,
        select: { id: true },
      },
    },
  });

  const [featured, ...recent] = operations;

  return (
    <section aria-labelledby="operations-preview-title" className="overflow-hidden bg-foreground px-6 py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Our work</p><h2 id="operations-preview-title" className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Service made visible through action.</h2></div>
          <p className="max-w-xl text-base leading-8 text-white/65 lg:justify-self-end">Carefully reviewed stories about support delivered by Janaza Welfare Society. Only approved public information and photos are shown.</p>
        </div>

        {featured ? (
          <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <Link href={`/operations/${featured.id}`} className="group relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              {featured.photos[0] ? <Image unoptimized src={`/operation-photos/${featured.photos[0].id}`} alt={`Public operation: ${featured.title}`} fill sizes="(min-width: 1024px) 65vw, 100vw" className="object-cover opacity-75 transition duration-500 group-hover:scale-[1.02] motion-reduce:transform-none motion-reduce:transition-none" /> : <div className="absolute inset-0 home-operation-placeholder" aria-hidden="true" />}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Latest operation</p>
                <h3 className="mt-3 max-w-2xl text-3xl font-semibold sm:text-4xl">{featured.title}</h3>
                <p className="mt-3 text-sm text-white/70">{featured.serviceType} <span aria-hidden="true">&#8226;</span> {featured.area} <span aria-hidden="true">&#8226;</span> {date.format(featured.operationDate)}</p>
                <p className="mt-4 max-w-2xl line-clamp-2 leading-7 text-white/75">{featured.shortDescription}</p>
              </div>
            </Link>
            <div className="grid gap-6">
              {recent.map((operation) => (
                <article key={operation.id} className="grid min-h-52 grid-cols-[7rem_1fr] overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] sm:grid-cols-[11rem_1fr]">
                  <div className="relative bg-primary/10">{operation.photos[0] ? <Image unoptimized src={`/operation-photos/${operation.photos[0].id}`} alt={`Public operation: ${operation.title}`} fill sizes="11rem" className="object-cover" /> : <div className="home-operation-placeholder size-full" aria-hidden="true" />}</div>
                  <div className="flex flex-col justify-center p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{operation.serviceType}</p><h3 className="mt-2 text-xl font-semibold">{operation.title}</h3><p className="mt-2 text-xs text-white/60">{operation.area} <span aria-hidden="true">&#8226;</span> {date.format(operation.operationDate)}</p><Link href={`/operations/${operation.id}`} className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-white underline decoration-primary decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Read story</Link></div>
                </article>
              ))}
            </div>
          </div>
        ) : <div className="mt-12 border-y border-white/15 py-14 text-center"><p className="text-lg font-semibold">Our public operations will appear here.</p><p className="mt-2 text-sm text-white/60">No reviewed public operation stories are available yet.</p></div>}

        <div className="mt-10 text-center"><Link href="/operations" className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary px-7 py-3 font-semibold text-white transition-colors hover:bg-primary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">View Our Operations</Link></div>
      </div>
    </section>
  );
}
