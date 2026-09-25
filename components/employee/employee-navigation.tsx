import Link from "next/link";

const items = [
  ["Dashboard", "/employee"],
  ["My Tasks", "/employee/my-tasks"],
  ["Completed Tasks", "/employee/completed"],
  ["Profile", "/employee/profile"],
  ["Availability", "/employee#availability"],
] as const;

export function EmployeeNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav aria-label="Employee navigation" className={mobile ? "flex snap-x gap-2 overflow-x-auto px-4 pb-3" : "mt-8 space-y-2"}>
      {items.map(([label, href]) => (
        <Link key={href} href={href} className={`${mobile ? "shrink-0" : "flex w-full"} items-center rounded-xl border border-transparent px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-light-background`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
