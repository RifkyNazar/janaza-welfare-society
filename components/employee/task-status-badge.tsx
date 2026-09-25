import type { TaskStatus } from "@/generated/prisma/enums";

const styles: Record<TaskStatus, string> = {
  ASSIGNED: "border-violet-200 bg-violet-50 text-violet-800",
  ACKNOWLEDGED: "border-cyan-200 bg-cyan-50 text-cyan-800",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-700",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{status.replaceAll("_", " ")}</span>;
}
