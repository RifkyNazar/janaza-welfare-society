import { T } from "@/components/public-language";
import Link from "next/link";
import { LeadershipCard } from "@/components/leadership-card";
import { PageHero } from "@/components/page-hero";
import { leadershipTeam } from "@/lib/leadership-team";
import { prisma } from "@/lib/prisma";
import { OperationalMembersGrid } from "@/components/operational-members-grid";
import { memberPage } from "@/lib/member-pagination";

export const dynamic = "force-dynamic";

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ membersPage?: string }> }) {
  const requestedPage = memberPage((await searchParams).membersPage);
  const count = await prisma.operationalTeamMember.count();
  const pages = Math.max(1, Math.ceil(count / 60));
  const page = Math.min(requestedPage, pages);
  const members = await prisma.operationalTeamMember.findMany({
    select: { id: true, fullName: true },
    orderBy: [{ fullName: "asc" }, { id: "asc" }],
    skip: (page - 1) * 60,
    take: 60,
  });

  return (
    <>
      <PageHero eyebrow="Our Team" title="Serving together with care and responsibility." description="Meet the people who lead and deliver the work of Janaza Welfare Society." />
      <section aria-labelledby="administration-team" className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground"><T text="Leadership" /></p>
            <h2 id="administration-team" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"><T text="Administration Team" /></h2>
            <div className="section-ornament" aria-hidden="true"><span /></div>
          </div>
          <div className="jws-leadership-grid mt-6 grid gap-3">
            {leadershipTeam.map((member) => <LeadershipCard key={member.position} member={member} />)}
          </div>
          <aside className="mt-12 rounded-2xl border border-border bg-light-background px-6 py-9 text-center sm:px-10">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground"><T text="Together for a Better Community" /></h3>
            <p className="mx-auto mt-3 max-w-2xl leading-7 text-muted"><T text="Our team is committed to serving the community with sincerity, compassion and dedication." /></p>
          </aside>
        </div>
      </section>
      <section aria-labelledby="operational-team" className="bg-light-background px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground"><T text="Our People" /></p>
            <h2 id="operational-team" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"><T text="Operational Team" /></h2>
            <div className="section-ornament" aria-hidden="true"><span /></div>
          </div>
          {members.length ? <OperationalMembersGrid members={members} /> : <p className="mx-auto mt-8 max-w-xl rounded-2xl border border-border bg-white px-6 py-8 text-center text-muted"><T text="Our approved operational team profiles will appear here as they become available." /></p>}
          {pages > 1 && <nav aria-label="Operational team pages" className="mt-6 flex flex-wrap items-center justify-center gap-4">{page > 1 && <Link href={`?membersPage=${page - 1}#operational-team`} className="inline-flex min-h-11 items-center underline"><T text="Previous" /></Link>}<span>{page} / {pages}</span>{page < pages && <Link href={`?membersPage=${page + 1}#operational-team`} className="inline-flex min-h-11 items-center underline"><T text="Next" /></Link>}</nav>}
        </div>
      </section>
    </>
  );
}
