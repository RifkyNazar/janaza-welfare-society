import { getPortalTranslation } from "@/lib/portal-language";
import { T } from "@/components/public-language";
import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { memberPage } from "@/lib/member-pagination";
import { OperationalMemberForm, DeleteOperationalMember } from "@/components/admin/operational-member-form";

export default async function OperationalTeamAdmin({ searchParams }: { searchParams: Promise<{ page?: string; deleted?: string }> }) {
  const { t } = await getPortalTranslation();
  await requireAdmin();
  const query = await searchParams;
  const requestedPage = memberPage(query.page);
  const count = await prisma.operationalTeamMember.count();
  const pages = Math.max(1, Math.ceil(count / 24));
  const page = Math.min(requestedPage, pages);
  const members = await prisma.operationalTeamMember.findMany({ orderBy: [{ fullName: "asc" }, { id: "asc" }], skip: (page - 1) * 24, take: 24, select: { id: true, fullName: true, version: true } });
  return <div className="mx-auto max-w-6xl"><h1 className="text-3xl font-semibold"><T text="Operational Team Members" /></h1><p className="mt-3 text-sm text-muted"><T text="Public member photos and names. These entries do not create or change employee accounts or Leadership profiles." /></p>{query.deleted === "1" && <p role="status" className="mt-4 rounded-xl border border-border p-4"><T text="Member deleted." /></p>}
    <section className="mt-7 max-w-2xl" aria-labelledby="add-member"><h2 id="add-member" className="mb-4 text-xl font-semibold"><T text="Add member" /></h2><OperationalMemberForm visibleMemberIds={members.map(member => member.id)} /></section>
    <section className="mt-10" aria-labelledby="manage-members"><h2 id="manage-members" className="text-xl font-semibold"><T text="Manage members (" />{count})</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{members.map(member => <article key={member.id} className="overflow-hidden rounded-2xl border border-border bg-white"><Image unoptimized src={`/team-member-photos/${member.id}?v=${member.version}`} alt={member.fullName} width={300} height={375} loading="lazy" className="aspect-[4/5] max-h-64 w-full object-cover" /><div className="space-y-3 p-4"><h3 className="break-words font-semibold">{member.fullName}</h3><Link href={`/admin/operational-team/${member.id}`} className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold"><T text="Edit member" /></Link><DeleteOperationalMember member={member} /></div></article>)}</div>
      {!members.length && <p className="mt-5 rounded-xl border border-border p-5 text-muted"><T text="No operational members added yet." /></p>}
      {pages > 1 && <nav aria-label={t("Member pages")} className="mt-6 flex flex-wrap items-center gap-4">{page > 1 && <Link href={`?page=${page - 1}`} className="inline-flex min-h-11 items-center underline"><T text="Previous" /></Link>}<span><T text="Page" /> {page} <T text="of" /> {pages}</span>{page < pages && <Link href={`?page=${page + 1}`} className="inline-flex min-h-11 items-center underline"><T text="Next" /></Link>}</nav>}
    </section></div>;
}
