import Link from "next/link";
import { LeadershipCard } from "@/components/leadership-card";
import { leadershipTeam } from "@/lib/leadership-team";

export function TeamPreview() {
  return (
    <section aria-labelledby="team-preview-title" className="bg-white px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">Our Team</p>
          <h2 id="team-preview-title" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Administration Team</h2>
          <div className="section-ornament" aria-hidden="true"><span /></div>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-muted">Meet the leadership guiding Janaza Welfare Society with responsibility and care.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {leadershipTeam.slice(0, 3).map((member) => <LeadershipCard key={member.position} member={member} compact />)}
        </div>
        <div className="mt-12 text-center">
          <Link href="/team" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-foreground transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(69,232,205,0.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none">
            View Our Team <span className="cta-gem" aria-hidden="true" /><span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
