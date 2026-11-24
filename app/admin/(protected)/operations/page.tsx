import { getPortalTranslation } from "@/lib/portal-language";
import { T } from "@/components/public-language";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "Operations" };


export default async function AdminOperationsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { dateLocale, t } = await getPortalTranslation();
  const date = new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium" });
  await requireAdmin();
  const parameters = await searchParams;
  const q = parameters.q?.trim().slice(0, 100) ?? "";
  const operations = await prisma.operation.findMany({ where: { ...(q ? { OR: [{ title: { contains: q } }, { area: { contains: q } }, { serviceType: { contains: q } }] } : {}) }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, serviceType: true, area: true, operationDate: true, isPublished: true, createdAt: true } });
  return <div className="mx-auto max-w-7xl"><p className="text-sm font-semibold text-primary"><T text="Public content" /></p><h1 className="mt-1 text-3xl font-semibold"><T text="Operations & Activities" /></h1><Link href="/admin/operations/new" className="mt-4 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold"><T text="Add Operation" /></Link><p className="mt-2 text-sm text-muted"><T text="Manage operations and recent activities." /></p><div className="mt-7 rounded-2xl border border-border bg-white p-4"><form className="flex gap-2"><input name="q" type="search" defaultValue={q} placeholder={t("Search title, area, or service type")} className="min-w-0 flex-1 rounded-xl border border-border px-4 py-3 outline-none focus:border-primary" /><button className="rounded-xl bg-foreground px-5 text-sm font-semibold text-white"><T text="Search" /></button></form></div><div className="mt-6 space-y-4">{operations.length ? operations.map((operation) => <article key={operation.id} className="grid gap-4 rounded-2xl border border-border bg-white p-5 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center"><div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${operation.isPublished ? "bg-primary/25" : "bg-light-background text-muted"}`}><T text={operation.isPublished ? "Published" : "Private"} /></span><h2 className="mt-3 text-lg font-semibold">{operation.title}</h2><p className="mt-1 text-sm text-muted">{operation.serviceType}</p></div><div className="text-sm"><p>{operation.area}</p><p className="mt-1 text-muted"><T text="Operation:" /> {date.format(operation.operationDate)}</p></div><p className="text-sm text-muted"><T text="Created" /> {date.format(operation.createdAt)}</p><Link href={`/admin/operations/${operation.id}`} className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold hover:border-primary"><T text="Manage" /></Link></article>) : <p className="rounded-2xl border border-border bg-white p-10 text-center text-muted"><T text="No operations found." /></p>}</div></div>;
}
