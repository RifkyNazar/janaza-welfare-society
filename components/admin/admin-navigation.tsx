import Link from "next/link";

const items = [
  { label: "Dashboard", href: "/admin", available: true },
  { label: "Employees", href: "/admin/employees", available: true },
  { label: "Service Requests", href: "/admin/service-requests", available: true },
  { label: "Task Assignments", href: "/admin/task-assignments", available: true },
] as const;

export function AdminNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav aria-label="Admin navigation" className={mobile ? "flex gap-2 overflow-x-auto px-4 pb-3" : "mt-8 space-y-2"}>
      {items.map((item) =>
        item.available ? (
          <Link key={item.label} href={item.href} className={`${mobile ? "shrink-0" : "flex w-full"} items-center rounded-xl border border-transparent px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-light-background`}>
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
