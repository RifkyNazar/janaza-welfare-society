"use server";

import type { ServiceRequestStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type PublicTrackingResult = {
  requestCode: string;
  serviceType: string;
  requiredDate: string;
  requiredTime: string | null;
  area: string;
  status: ServiceRequestStatus;
  submittedDate: string;
};

export type TrackRequestActionState = {
  error?: string;
  result?: PublicTrackingResult;
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

  if (!requestCode || !mobileNumber) {
    return { error: "Please enter your request code and mobile number." };
  }

  if (
    requestCode.length > REQUEST_CODE_MAX_LENGTH ||
    mobileNumber.length > MOBILE_NUMBER_MAX_LENGTH ||
    !PHONE_PATTERN.test(mobileNumber)
  ) {
    return { error: NOT_FOUND_MESSAGE };
  }

  const request = await prisma.serviceRequest.findFirst({
    where: { requestCode, mobileNumber },
    select: {
      requestCode: true,
      serviceType: true,
      requiredDate: true,
      requiredTime: true,
      area: true,
      status: true,
      createdAt: true,
    },
  });

  if (!request) return { error: NOT_FOUND_MESSAGE };

  return {
    result: {
      requestCode: request.requestCode,
      serviceType: request.serviceType,
      requiredDate: request.requiredDate.toISOString(),
      requiredTime: request.requiredTime,
      area: request.area,
      status: request.status,
      submittedDate: request.createdAt.toISOString(),
    },
  };
}
