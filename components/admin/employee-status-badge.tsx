import type { AccountStatus } from "@/generated/prisma/enums";

const styles: Record<AccountStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
  DISABLED: "border-slate-200 bg-slate-100 text-slate-700",
};

export function EmployeeStatusBadge({ status }: { status: AccountStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>;
}
