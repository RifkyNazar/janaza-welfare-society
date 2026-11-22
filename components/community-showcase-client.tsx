"use client";
import { T } from "@/components/public-language";

import Image from "next/image";
import { PortraitRail } from "@/components/auto-scroll-rail";
import Link from "next/link";
import { leadershipTeam } from "@/lib/leadership-team";
import { useShowcaseMotion } from "@/components/use-showcase-motion";
// Deliberately separate from private employee records. Only curated, public-approved assets belong here.
export type PublicTeamPortrait = {
    id: string;
    name?: string;
    role?: string;
    imageSrc: string;
};
type Vehicle = {
    id: string;
    name: string;
    imageUrl: string | null;
    vehicleType: string;
};
import { TeamCarousel, type PublicTeamMember } from "@/components/team-carousel";
const categories = ["Our Community Leaders", "Our Operation Team", "Our Vehicles"];
export function CommunityShowcaseClient({ vehicles, publicTeam = [] }: {
    vehicles: Vehicle[];
    publicTeam?: PublicTeamMember[];
}) {
    const m = useShowcaseMotion(3, 1000, false);
    return <section className="community-section px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="community-title"><div className="mx-auto max-w-7xl" {...m.interaction}>
 <div className="flex flex-wrap items-end justify-between gap-6"><div><p className="jws-eyebrow"><T text="The people. The purpose." /></p><h2 id="community-title" className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl"><T text="Local people." /><br /><T text="Shared responsibility." /></h2></div><p className="max-w-sm text-sm leading-7 text-muted"><T text="Community leadership, dedicated people and service vehicles. Together, supporting families with dignity." /></p></div>
 <div className="mt-8 flex flex-wrap items-center justify-between gap-4"><div className="category-tabs" role="group" aria-label="Community categories">{categories.map((c, i) => <button key={c} type="button" aria-pressed={m.index === i} onClick={() => m.setIndex(i)}><T text={c} /></button>)}</div></div>
 <div className="showcase-stage mt-6">
 <div hidden={m.index !== 0} className="showcase-slide"><PortraitRail stopped={m.stopped} count={leadershipTeam.length}>{leadershipTeam.map(member => <Link key={member.position} href="/team#administration-team" className="portrait-card"><div className="relative h-60 overflow-hidden bg-light-background sm:h-64">{member.photoSrc && <Image src={member.photoSrc} alt={member.name + ', ' + member.position} fill sizes="(min-width: 768px) 30vw, 75vw" className="object-contain object-bottom"/>}<span className="portrait-position">{member.position}</span></div><div className="flex items-center justify-between gap-2 p-5"><h3 className="text-lg font-semibold">{member.name}</h3><span aria-hidden="true">&#8599;</span></div></Link>)}</PortraitRail></div>
 <div hidden={m.index !== 1} className="showcase-slide">{m.index === 1 && <TeamCarousel members={publicTeam} />}</div>
 <div hidden={m.index !== 2} className="showcase-slide">{vehicles.length ? <PortraitRail stopped={m.stopped} count={vehicles.length}>{vehicles.map(v => <Link href={'/vehicles#vehicle-' + v.id} key={v.id} className="portrait-card"><div className="relative flex h-60 items-center justify-center bg-light-background sm:h-64">{v.imageUrl ? <Image unoptimized src={v.imageUrl} alt={v.name} fill sizes="(min-width:768px) 30vw,75vw" className="object-contain p-4"/> : <span className="text-sm text-muted"><T text="Vehicle photo coming soon" /></span>}</div><div className="p-5"><p className="text-xs text-muted">{v.vehicleType}</p><h3 className="mt-1 font-semibold">{v.name} &#8599;</h3></div></Link>)}</PortraitRail> : <div className="team-empty glass-panel"><p className="jws-eyebrow"><T text="Our Vehicles" /></p><h3 className="mt-3 text-2xl font-semibold"><T text="Supporting every journey." /></h3><p className="mt-3 text-sm text-muted"><T text="Public vehicle information will appear as it becomes available." /></p><Link href="/vehicles" className="jws-text-link mt-5"><T text="Our service vehicles" /> &#8599;</Link></div>}</div>
 </div><div className="mt-6 flex items-center justify-between border-t border-border pt-5 text-xs text-muted"><span><T text="Rooted in our community. Guided by care." /></span><Link className="jws-text-link" href="/about"><T text="About JWS" /> &#8599;</Link></div>
 </div></section>;
}
