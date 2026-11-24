"use server";

import type { ServiceRequestStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { readProfilePhoto } from "@/lib/profile-photo-storage";
import { consumeRateLimit } from "@/lib/rate-limit";

export type PublicTrackingResult = {
  requestCode: string;
  serviceType: string;
  category: string;
  selectedServices: string;
  area: string;
  status: ServiceRequestStatus;
  submittedDate: string;
  completedDate: string | null;
  employee: { fullName: string; position: string; phone: string; photo: string | null } | null;
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

  const rateLimit = await consumeRateLimit("request-tracking", { limit: 20, windowMs: 15 * 60_000 });
  if (!rateLimit.allowed) return { error: "Too many tracking attempts. Please try again later.", values };

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
      taskAssignments: {
        where: { OR: [{ isActive: true }, { status: "COMPLETED" }] },
        orderBy: [{ isActive: "desc" }, { assignedAt: "desc" }, { id: "desc" }],
        take: 1,
        select: { status: true, completedAt: true, isActive: true, employee: { select: { fullName: true, phone: true, position: true, photoUrl: true } } },
      },
    },
  });

  if (!request) return { error: NOT_FOUND_MESSAGE, values };

  const assignment = request.taskAssignments[0];
  const completed = request.status !== "CANCELLED" && (request.status === "COMPLETED" || assignment?.status === "COMPLETED");
  const assigned = request.status !== "CANCELLED" && (assignment?.isActive || completed) ? assignment?.employee : null;
  let photo: string | null = null;
  if (assigned?.photoUrl) {
    const bytes = await readProfilePhoto(assigned.photoUrl);
    if (bytes) {
      const thumbnail = await sharp(bytes, { limitInputPixels: 40_000_000 }).rotate()
        .resize(160, 160, { fit: "inside", withoutEnlargement: true }).webp().toBuffer().catch(() => null);
      if (thumbnail) photo = "data:image/webp;base64," + thumbnail.toString("base64");
    }
  }
  return {
    values,
    result: {
      requestCode: request.requestCode,
      serviceType: request.serviceType,
      category: request.serviceCategory === "JANAZAH" ? "Janazah Service" : request.serviceCategory === "VEHICLE" ? "Vehicle Service" : "Legacy Request",
      selectedServices: request.serviceSelections.length ? request.serviceSelections.map((selection) => selection.serviceLabel).join(", ") : request.serviceType,
      area: request.area,
      status: completed ? "COMPLETED" : request.status,
      completedDate: completed ? assignment?.completedAt?.toISOString() ?? null : null,
      employee: assigned ? { fullName: assigned.fullName, position: assigned.position, phone: assigned.phone, photo } : null,
      submittedDate: request.createdAt.toISOString(),
    },
  };
}
