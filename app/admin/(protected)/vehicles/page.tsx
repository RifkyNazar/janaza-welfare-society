import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { vehicleImageSrc } from "@/lib/vehicle-image-storage";

export const metadata: Metadata = { title: "Vehicles" };
const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

export default async function AdminVehiclesPage({ searchParams }: { searchParams: Promise<{ status?: string; visibility?: string; q?: string; deleted?: string }> }) {
  await requireAdmin();
  const parameters = await searchParams;
  const status = parameters.status === "active" || parameters.status === "inactive" ? parameters.status : "all";
  const visibility = parameters.visibility === "public" || parameters.visibility === "hidden" ? parameters.visibility : "all";
  const q = parameters.q?.trim().slice(0, 100) ?? "";
  const vehicles = await prisma.vehicle.findMany({
    where: {
      ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
      ...(visibility === "public" ? { isPublic: true } : visibility === "hidden" ? { isPublic: false } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { vehicleNumber: { contains: q } }, { vehicleType: { contains: q } }] } : {}),
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  const query = (nextStatus: string, nextVisibility: string) => `/admin/vehicles?status=${nextStatus}&visibility=${nextVisibility}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  return <div className="mx-auto max-w-7xl">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-primary">Fleet management</p><h1 className="mt-1 text-3xl font-semibold">Vehicles</h1><p className="mt-2 text-sm text-muted">Manage the society&apos;s real service vehicles and public visibility.</p></div><Link href="/admin/vehicles/new" className="rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold">Add Vehicle</Link></div>
    {parameters.deleted === "1" && <p role="status" aria-live="polite" className="mt-5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold">Vehicle deleted successfully.</p>}
    <div className="mt-7 rounded-2xl border border-border bg-white p-4">
      <div className="flex flex-wrap gap-2">{[["all","All"],["active","Active"],["inactive","Inactive"]].map(([key,label]) => <Link key={key} href={query(key, visibility)} className={`rounded-full px-4 py-2 text-sm font-semibold ${status === key ? "bg-primary" : "border border-border"}`}>{label}</Link>)}</div>
      <div className="mt-3 flex flex-wrap gap-2">{[["all","All visibility"],["public","Public"],["hidden","Hidden"]].map(([key,label]) => <Link key={key} href={query(status, key)} className={`rounded-full px-4 py-2 text-sm font-semibold ${visibility === key ? "bg-foreground text-white" : "border border-border"}`}>{label}</Link>)}</div>
      <form className="mt-4 flex gap-2"><input type="hidden" name="status" value={status} /><input type="hidden" name="visibility" value={visibility} /><input name="q" type="search" defaultValue={q} placeholder="Search name, number, or type" className="min-w-0 flex-1 rounded-xl border border-border px-4 py-3 outline-none focus:border-primary" /><button className="rounded-xl bg-foreground px-5 text-sm font-semibold text-white">Search</button></form>
    </div>
    <div className="mt-6 space-y-4">{vehicles.length ? vehicles.map((vehicle) => <article key={vehicle.id} className="grid gap-4 rounded-2xl border border-border bg-white p-5 md:grid-cols-[5rem_1.4fr_1fr_auto] md:items-center">
      <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border border-border bg-light-background">{vehicle.imageUrl ? <Image unoptimized src={vehicleImageSrc(vehicle.id, vehicle.imageUrl)!} alt="" width={160} height={120} className="h-full w-full object-contain" /> : <VehiclePlaceholder />}</div>
      <div><div className="flex flex-wrap gap-2"><Badge active={vehicle.isActive} labels={["Active","Inactive"]} /><Badge active={vehicle.isPublic} labels={["Public","Hidden"]} /></div><h2 className="mt-3 text-lg font-semibold">{vehicle.name}</h2><p className="mt-1 text-sm text-muted">{vehicle.vehicleNumber} · {vehicle.vehicleType}</p></div>
      <div className="text-sm text-muted"><p>Display order: {vehicle.displayOrder}</p><p className="mt-1">Created {date.format(vehicle.createdAt)}</p><p className="mt-1">Updated {date.format(vehicle.updatedAt)}</p></div>
      <Link href={`/admin/vehicles/${vehicle.id}`} className="rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold hover:border-primary">Manage</Link>
    </article>) : <p className="rounded-2xl border border-border bg-white p-10 text-center text-muted">No vehicles found.</p>}</div>
  </div>;
}

function Badge({ active, labels }: { active: boolean; labels: [string, string] }) { return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-primary/25" : "bg-slate-100 text-muted"}`}>{active ? labels[0] : labels[1]}</span>; }
function VehiclePlaceholder() { return <svg aria-hidden="true" viewBox="0 0 64 40" className="w-12 text-muted/55" fill="none"><path d="M8 27h48M14 27l4-12h25l8 12M21 31a4 4 0 1 1-8 0m42 0a4 4 0 1 1-8 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
