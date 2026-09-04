import Link from "next/link";

const items = [
  ["Dashboard", "/employee"],
  ["Available Tasks", "/employee/tasks"],
  ["My Tasks", "/employee/my-tasks"],
  ["Completed Tasks", "/employee/completed"],
  ["Profile", "/employee/profile"],
] as const;

export function EmployeeNavigation({ mobile = false, availableCount = 0 }: { mobile?: boolean; availableCount?: number }) {
  return (
    <nav aria-label="Employee navigation" className={mobile ? "flex gap-2 overflow-x-auto px-4 pb-3" : "mt-8 space-y-2"}>
      {items.map(([label, href]) => (
        <Link key={href} href={href} className={`${mobile ? "shrink-0" : "flex w-full"} items-center rounded-xl border border-transparent px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-light-background`}>
          {label}{href === "/employee/tasks" && availableCount > 0 && <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs tabular-nums">{availableCount}</span>}
        </Link>
      ))}
    </nav>
  );
}
