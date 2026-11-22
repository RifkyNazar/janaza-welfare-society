import Image from "next/image";

export function OperationalMembersGrid({ members }: { members: Array<{ id: number; fullName: string }> }) {
  return <div className="jws-operational-members mt-6 grid grid-cols-3 items-stretch gap-2 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 xl:grid-cols-6">
    {members.map(member => <article key={member.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-white">
      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-light-background"><Image unoptimized src={`/team-member-photos/${member.id}`} alt={member.fullName} fill loading="lazy" sizes="(min-width: 1280px) 190px, (min-width: 768px) 20vw, (min-width: 640px) 25vw, 33vw" className="object-cover object-center" /></div>
      <h3 className="flex min-h-11 flex-1 items-center justify-center break-words p-2 text-center text-xs font-semibold leading-relaxed sm:p-3 sm:text-sm">{member.fullName}</h3>
    </article>)}
  </div>;
}
