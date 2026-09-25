import Link from "next/link";

const items = [["Dashboard", "/supervisor"], ["Requests / Dispatch", "/supervisor/requests"], ["Tasks", "/supervisor/tasks"], ["Employees", "/supervisor/employees"], ["Vehicles", "/supervisor/vehicles"]] as const;
export function SupervisorNavigation({ mobile = false }: { mobile?: boolean }) {
  return <nav aria-label="Supervisor navigation" className={mobile ? "flex gap-2 overflow-x-auto px-4 pb-3" : "mt-8 space-y-2"}>{items.map(([label, href]) => <Link key={href} href={href} className={`${mobile ? "shrink-0" : "flex w-full"} min-h-11 items-center rounded-xl px-4 py-3 text-sm font-semibold hover:bg-light-background focus-visible:outline-2 focus-visible:outline-primary`}>{label}</Link>)}</nav>;
}
