import Image from "next/image";
import Link from "next/link";
import { leadershipTeam } from "@/lib/leadership-team";
import { prisma } from "@/lib/prisma";
import { profilePhotoSrc } from "@/lib/profile-photo-storage";

function PeopleIcon() { return <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" className="size-12"><circle cx="18" cy="17" r="7" stroke="currentColor" strokeWidth="2"/><circle cx="34" cy="19" r="5" stroke="currentColor" strokeWidth="2"/><path d="M6 39c0-7 5.4-12 12-12s12 5 12 12M30 29c6 0 10 3.8 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>; }
function VehicleIcon() { return <svg aria-hidden="true" viewBox="0 0 64 48" fill="none" className="size-14"><path d="M6 33h52M14 33l6-17h25l10 17M24 16v17M45 16v17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="17" cy="37" r="5" stroke="currentColor" strokeWidth="2"/><circle cx="49" cy="37" r="5" stroke="currentColor" strokeWidth="2"/></svg>; }

export async function AboutSnapshot() {
  const [team, vehicle] = await Promise.all([
    prisma.employeeProfile.findFirst({ where: { isPublicProfile: true, user: { role: "EMPLOYEE", status: "APPROVED" }, photoUrl: { not: null } }, select: { fullName: true, photoUrl: true }, orderBy: { fullName: "asc" } }),
    prisma.vehicle.findFirst({ where: { isActive: true, isPublic: true }, select: { name: true, imageUrl: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] }),
  ]);
  const items = [
    { href: "/team", label: "Leadership", title: `${leadershipTeam.length} community leaders`, image: null, icon: <PeopleIcon /> },
    { href: "/team", label: "Our team", title: team?.fullName ?? "A trusted service team", image: profilePhotoSrc(team?.photoUrl ?? null), icon: <PeopleIcon /> },
    { href: "/vehicles", label: "Our vehicles", title: vehicle?.name ?? "Ready for community service", image: vehicle?.imageUrl ?? null, icon: <VehicleIcon /> },
  ];
  return <section aria-labelledby="about-snapshot-title" className="overflow-hidden bg-white px-6 py-16 sm:py-24"><div className="mx-auto max-w-7xl">
    <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">About JWS</p><h2 id="about-snapshot-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Local people. Shared responsibility.</h2></div><div className="lg:justify-self-end"><p className="max-w-xl leading-7 text-muted">Janaza Welfare Society brings together community leadership, trained team members and dedicated vehicles to support families with dignity.</p><Link href="/about" className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold underline decoration-primary decoration-2 underline-offset-4">Learn about JWS <span aria-hidden="true">→</span></Link></div></div>
    <div className="mt-10 grid gap-4 sm:grid-cols-3">{items.map((item) => <Link key={item.label} href={item.href} className="group relative min-h-64 overflow-hidden rounded-3xl border border-border bg-light-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
      {item.image ? <Image unoptimized src={item.image} alt={item.title} fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transition-none" /> : <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(69,232,205,0.28),transparent_55%)] text-foreground/55">{item.icon}</div>}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/10 to-transparent"/><div className="absolute inset-x-0 bottom-0 p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{item.label}</p><h3 className="mt-2 text-xl font-semibold">{item.title}</h3></div>
    </Link>)}</div>
  </div></section>;
}
