import Image from "next/image";
import { LeadershipCard } from "@/components/leadership-card";
import { PageHero } from "@/components/page-hero";
import { leadershipTeam } from "@/lib/leadership-team";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const employees = await prisma.employeeProfile.findMany({
    where: { isPublicProfile: true, user: { role: "EMPLOYEE", status: "APPROVED" } },
    select: { id: true, fullName: true, position: true, duty: true, photoUrl: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <>
      <PageHero eyebrow="Our Team" title="Serving together with care and responsibility." description="Meet the people who lead and deliver the work of Janaza Welfare Society." />
      <section aria-labelledby="administration-team" className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">Leadership</p>
            <h2 id="administration-team" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Administration Team</h2>
            <div className="section-ornament" aria-hidden="true"><span /></div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {leadershipTeam.map((member) => <LeadershipCard key={member.position} member={member} />)}
          </div>
          <aside className="mt-12 rounded-2xl border border-border bg-light-background px-6 py-9 text-center sm:px-10">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Together for a Better Community</h3>
            <p className="mx-auto mt-3 max-w-2xl leading-7 text-muted">Our team is committed to serving the community with sincerity, compassion and dedication.</p>
          </aside>
        </div>
      </section>
      <section aria-labelledby="operational-team" className="bg-light-background px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">Our People</p>
            <h2 id="operational-team" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Operational Team</h2>
            <div className="section-ornament" aria-hidden="true"><span /></div>
          </div>
          {employees.length ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {employees.map((employee) => (
                <article key={employee.id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_30px_rgba(16,42,42,0.06)]">
                  <div className="relative aspect-[4/3] border-b border-border bg-white">
                    {employee.photoUrl ? <Image src={employee.photoUrl} alt={`${employee.fullName}, ${employee.position}`} fill className="object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" /> : <div className="flex h-full items-center justify-center bg-[linear-gradient(145deg,#F4FFFC,#FFFFFF)] text-3xl font-semibold text-primary" aria-label={`${employee.fullName} photo placeholder`}>{employee.fullName.charAt(0)}</div>}
                  </div>
                  <div className="p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{employee.position}</p><h3 className="mt-2 text-xl font-semibold text-foreground">{employee.fullName}</h3>{employee.duty && <p className="mt-3 leading-7 text-muted">{employee.duty}</p>}</div>
                </article>
              ))}
            </div>
          ) : <p className="mx-auto mt-10 max-w-xl rounded-2xl border border-border bg-white px-6 py-8 text-center text-muted">Our approved operational team profiles will appear here as they become available.</p>}
        </div>
      </section>
    </>
  );
}
