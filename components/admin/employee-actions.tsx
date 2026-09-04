import Link from "next/link";
import type { AccountStatus } from "@/generated/prisma/enums";
import { updateEmployeeStatus } from "@/app/admin/(protected)/employees/actions";
import { EmployeeStatusAction } from "@/components/admin/employee-status-action";

export function EmployeeActions({ userId, status }: { userId: number; status: AccountStatus }) {
  const action = (transition: string) => updateEmployeeStatus.bind(null, userId, transition);

  return (
    <div className="flex flex-wrap items-start gap-2">
      <Link href={`/admin/employees/${userId}`} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:border-primary hover:bg-light-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">View Details</Link>
      {status === "PENDING" && (
        <>
          <EmployeeStatusAction action={action("approve")} label="Approve" />
          <EmployeeStatusAction action={action("reject")} label="Reject" confirmation="Reject this employee registration?" destructive />
        </>
      )}
      {status === "APPROVED" && (
        <EmployeeStatusAction action={action("disable")} label="Disable" confirmation="Disable this employee account?" destructive />
      )}
      {status === "DISABLED" && (
        <EmployeeStatusAction action={action("reactivate")} label="Reactivate" />
      )}
      {status === "REJECTED" && (
        <EmployeeStatusAction action={action("approve")} label="Approve" />
      )}
    </div>
  );
}
