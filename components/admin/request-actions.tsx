import Link from "next/link";
import type { ServiceRequestStatus } from "@/generated/prisma/enums";
import { cancelServiceRequest } from "@/app/admin/(protected)/service-requests/actions";
import { CancelRequestAction } from "@/components/admin/cancel-request-action";

export function RequestActions({ requestId, status }: { requestId: number; status: ServiceRequestStatus }) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <Link href={`/admin/service-requests/${requestId}`} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:border-primary hover:bg-light-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">View Details</Link>
      {status === "NEW" && <CancelRequestAction action={cancelServiceRequest.bind(null, requestId)} />}
    </div>
  );
}
