"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Dashboard", href: "/admin", available: true },
  { label: "View Website", href: "/", available: true },
  { label: "Requests", href: "/admin/service-requests", available: true },
  { label: "Employees", href: "/admin/employees", available: true },
  { label: "Supervisors", href: "/admin/supervisors", available: true },
  { label: "Task Assignments", href: "/admin/task-assignments", available: true },
  { label: "Operations", href: "/admin/operations", available: true },
  { label: "Vehicles", href: "/admin/vehicles", available: true },
  { label: "Advertisements", href: "/admin/advertisements", available: true },
  { label: "Donations", href: "/admin/donations", available: true },
] as const;

export function AdminNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin navigation" className={mobile ? "grid grid-cols-2 gap-2 px-4 pb-3 sm:grid-cols-3" : "mt-8 space-y-2"}>
      {items.map((item) =>
        item.available ? (
          <Link key={item.label} href={item.href} aria-current={pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)) ? "page" : undefined} className={`${mobile ? "" : "flex w-full"} items-center rounded-xl border px-4 py-3 text-sm font-semibold text-foreground transition ${pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)) ? "border-primary/50 bg-primary/15" : "border-transparent hover:border-primary/40 hover:bg-light-background"}`}>
            {item.label}
          </Link>
        ) : (
          <span key={item.label} className={`${mobile ? "shrink-0" : "flex w-full justify-between"} items-center rounded-xl px-4 py-3 text-sm font-medium text-muted`}>
            {item.label}
            {!mobile && <span className="text-[10px] uppercase tracking-wider text-muted/70">Soon</span>}
          </span>
        ),
      )}
    </nav>
  );
}
