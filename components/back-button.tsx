import Link from "next/link";

type BackButtonProps = {
  fallbackHref: string;
  label?: string;
  className?: string;
};

const fallbackLabels: Record<string, string> = { "/": "Back to Home", "/admin/operations": "Back to Operations", "/admin/vehicles": "Back to Vehicles", "/admin/donations": "Back to Donations", "/admin/advertisements": "Back to Advertisements", "/admin/supervisors": "Back to Supervisors", "/admin/task-assignments": "Back to Task Assignments", "/admin/employees": "Back to Employees", "/admin/service-requests": "Back to Requests", "/employee": "Back to Dashboard", "/employee/tasks": "Back to Available Tasks", "/employee/my-tasks": "Back to My Tasks", "/employee/completed": "Back to Completed Tasks" };

export function BackButton({ fallbackHref, label, className = "" }: BackButtonProps) {
  const resolvedLabel = label ?? fallbackLabels[fallbackHref] ?? "Back";

  return (
    <Link
      href={fallbackHref}
      aria-label={resolvedLabel}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/50 bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 10H4m5-5-5 5 5 5" />
      </svg>
      <span>{resolvedLabel}</span>
    </Link>
  );
}
