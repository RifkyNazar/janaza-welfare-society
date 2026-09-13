import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Our Service Vehicles | Janaza Welfare Society", description: "Vehicles supporting Janaza services and community assistance." };
export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({ where: { isActive: true, isPublic: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, vehicleNumber: true, vehicleType: true, description: true, imageUrl: true } });
  return <section className="relative overflow-hidden bg-gradient-to-b from-light-background to-white px-5 py-14 sm:px-6 sm:py-20">
    <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
    <div className="relative mx-auto max-w-7xl"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">JWS Fleet</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Our Service Vehicles</h1><div className="section-ornament" aria-hidden="true"><span /></div><p className="mt-4 text-sm leading-6 text-muted sm:text-base">Vehicles supporting Janaza services and community assistance.</p></div>
      {vehicles.length ? <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:mt-14">{vehicles.map((vehicle) => <article key={vehicle.id} className="vehicle-card-3d group overflow-hidden rounded-3xl border border-border bg-white shadow-[0_18px_50px_rgba(16,42,42,0.09)]">
        <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-light-background via-white to-primary/10">{vehicle.imageUrl ? <Image unoptimized src={vehicle.imageUrl} alt={`${vehicle.name}, ${vehicle.vehicleType}`} fill sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transition-none" /> : <VehiclePlaceholder />}</div>
        <div className="p-6 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{vehicle.vehicleType}</p><h2 className="mt-2 text-2xl font-semibold">{vehicle.name}</h2><p className="mt-2 inline-flex rounded-full border border-border bg-light-background px-3 py-1 text-sm font-semibold">{vehicle.vehicleNumber}</p>{vehicle.description && <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-muted">{vehicle.description}</p>}</div>
      </article>)}</div> : <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-border bg-white p-10 text-center shadow-[0_12px_40px_rgba(16,42,42,0.05)]"><VehiclePlaceholder /><h2 className="mt-5 text-xl font-semibold">No vehicles are currently listed</h2><p className="mt-2 text-sm text-muted">Please check back later for public vehicle information.</p></div>}
    </div>
  </section>;
}

function VehiclePlaceholder() { return <svg aria-hidden="true" viewBox="0 0 120 72" className="mx-auto w-28 text-muted/35" fill="none"><path d="M13 49h94M25 49l9-26h45l18 26M39 58a9 9 0 1 1-18 0m78 0a9 9 0 1 1-18 0M36 23v26m43-26v26" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
