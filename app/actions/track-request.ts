"use server";

import type { ServiceRequestStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type PublicTrackingResult = {
  requestCode: string;
  serviceType: string;
  category: string;
  selectedServices: string;
  area: string;
  status: ServiceRequestStatus;
  submittedDate: string;
};

export type TrackRequestActionState = {
  error?: string;
  result?: PublicTrackingResult;
  values?: { requestCode: string; mobileNumber: string };
};

const NOT_FOUND_MESSAGE = "We could not find a request matching those details.";
const PHONE_PATTERN = /^[+]?[0-9][0-9\s-]{7,20}$/;
const REQUEST_CODE_MAX_LENGTH = 64;
const MOBILE_NUMBER_MAX_LENGTH = 30;

function text(formData: FormData, name: string) {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry.trim() : "";
}

export async function trackServiceRequest(
  _previousState: TrackRequestActionState,
  formData: FormData,
): Promise<TrackRequestActionState> {
  void _previousState;

  const requestCode = text(formData, "requestCode");
  const mobileNumber = text(formData, "mobileNumber");
  const values = { requestCode, mobileNumber };

  if (!requestCode || !mobileNumber) {
    return { error: "Please enter your request code and mobile number.", values };
  }

  if (
    requestCode.length > REQUEST_CODE_MAX_LENGTH ||
    mobileNumber.length > MOBILE_NUMBER_MAX_LENGTH ||
    !PHONE_PATTERN.test(mobileNumber)
  ) {
    return { error: NOT_FOUND_MESSAGE, values };
  }

  const request = await prisma.serviceRequest.findFirst({
    where: { requestCode, mobileNumber },
    select: {
      requestCode: true,
      serviceType: true,
      serviceCategory: true,
      serviceSelections: { select: { serviceLabel: true }, orderBy: { id: "asc" } },
      area: true,
      status: true,
      createdAt: true,
    },
  });

  if (!request) return { error: NOT_FOUND_MESSAGE, values };

  return {
    values,
    result: {
      requestCode: request.requestCode,
      serviceType: request.serviceType,
      category: request.serviceCategory === "JANAZAH" ? "Janazah Service" : request.serviceCategory === "VEHICLE" ? "Vehicle Service" : "Legacy Request",
      selectedServices: request.serviceSelections.length ? request.serviceSelections.map((selection) => selection.serviceLabel).join(", ") : request.serviceType,
      area: request.area,
      status: request.status,
      submittedDate: request.createdAt.toISOString(),
    },
  };
}
