import type { Metadata } from "next";
import { OperationCard } from "@/components/operation-card";
import { PageHero } from "@/components/page-hero";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Operations | Janaza Welfare Society", description: "Published community operations from Janaza Welfare Society." };
export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const operations = await prisma.operation.findMany({ where: { isPublished: true }, orderBy: { operationDate: "desc" }, select: { id: true, title: true, shortDescription: true, serviceType: true, area: true, operationDate: true, photos: { where: { taskPhoto: { isApprovedForPublic: true } }, orderBy: { displayOrder: "asc" }, take: 1, select: { id: true } } } });
  return <><PageHero eyebrow="Our Operations" title="Serving the community through action." description="Carefully reviewed stories about the support delivered by Janaza Welfare Society." /><section className="bg-light-background px-6 py-16 sm:py-20"><div className="mx-auto max-w-7xl">{operations.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{operations.map((operation) => <OperationCard key={operation.id} operation={operation} />)}</div> : <p className="rounded-2xl border border-border bg-white p-10 text-center text-muted">No public operations are available yet.</p>}</div></section></>;
}
