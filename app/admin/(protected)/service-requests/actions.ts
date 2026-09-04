"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export type RequestActionState = {
  error?: string;
  success?: string;
};

export async function cancelServiceRequest(
  requestId: number,
  _previousState: RequestActionState,
  _formData: FormData,
): Promise<RequestActionState> {
  void _previousState;
  void _formData;
  await requireAdmin();

  if (!Number.isSafeInteger(requestId) || requestId <= 0) {
    return { error: "Invalid service request." };
  }

  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { status: true },
  });

  if (!request) {
    return { error: "Service request not found." };
  }
  if (request.status !== "NEW") {
    return { error: "Only a new service request can be cancelled." };
  }

  const result = await prisma.serviceRequest.updateMany({
    where: { id: requestId, status: "NEW" },
    data: { status: "CANCELLED" },
  });

  if (result.count !== 1) {
    return { error: "The request changed before cancellation completed. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/service-requests");
  revalidatePath(`/admin/service-requests/${requestId}`);

  return { success: "Service request cancelled." };
}
