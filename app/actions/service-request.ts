"use server";

import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createRequestConfirmationPdf } from "@/lib/request-confirmation-pdf";

export type ServiceRequestActionState = {
  error?: string;
  requestCode?: string;
  status?: "NEW";
  pdfBase64?: string;
};

const limits = {
  requesterName: 150,
  mobileNumber: 30,
  alternativeNumber: 30,
  relationshipToDeceased: 120,
  serviceType: 120,
  requiredTime: 20,
  address: 1000,
  area: 150,
  hospitalName: 200,
  note: 2000,
} as const;

function text(formData: FormData, name: string) {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry.trim() : "";
}

function optional(value: string) {
  return value || null;
}

function exceeds(value: string, key: keyof typeof limits) {
  return value.length > limits[key];
}

function requestCode() {
  const year = new Date().getFullYear();
  return `JWS-REQ-${year}-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export async function submitServiceRequest(
  _previousState: ServiceRequestActionState,
  formData: FormData,
): Promise<ServiceRequestActionState> {
  void _previousState;

  const requesterName = text(formData, "requesterName");
  const mobileNumber = text(formData, "mobileNumber");
  const alternativeNumber = text(formData, "alternativeNumber");
  const relationshipToDeceased = text(formData, "relationshipToDeceased");
  const serviceType = text(formData, "serviceType");
  const preferredVehicleId = text(formData, "preferredVehicleId");
  const requiredDateInput = text(formData, "requiredDate");
  const requiredTime = text(formData, "requiredTime");
  const placeTypeInput = text(formData, "placeType").toUpperCase();
  const address = text(formData, "address");
  const area = text(formData, "area");
  const latitudeInput = text(formData, "latitude");
  const longitudeInput = text(formData, "longitude");
  const hospitalName = text(formData, "hospitalName");
  const note = text(formData, "note");

  if (!requesterName || !mobileNumber || !serviceType || !requiredDateInput || !placeTypeInput || !address || !area) {
    return { error: "Please complete all required fields." };
  }

  if (
    exceeds(requesterName, "requesterName") ||
    exceeds(mobileNumber, "mobileNumber") ||
    exceeds(alternativeNumber, "alternativeNumber") ||
    exceeds(relationshipToDeceased, "relationshipToDeceased") ||
    exceeds(serviceType, "serviceType") ||
    exceeds(requiredTime, "requiredTime") ||
    exceeds(address, "address") ||
    exceeds(area, "area") ||
    exceeds(hospitalName, "hospitalName") ||
    exceeds(note, "note")
  ) {
    return { error: "One or more fields exceed the allowed length." };
  }

  const phonePattern = /^[+]?[0-9][0-9\s-]{7,20}$/;
  if (!phonePattern.test(mobileNumber) || (alternativeNumber && !phonePattern.test(alternativeNumber))) {
    return { error: "Please enter valid contact numbers." };
  }

  const placeTypes = ["HOME", "HOSPITAL", "OTHER"] as const;
  if (!placeTypes.includes(placeTypeInput as (typeof placeTypes)[number])) {
    return { error: "Please select a valid place type." };
  }
  const placeType = placeTypeInput as (typeof placeTypes)[number];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(requiredDateInput)) {
    return { error: "Please enter a valid required date." };
  }
  const requiredDate = new Date(`${requiredDateInput}T00:00:00.000Z`);
  if (Number.isNaN(requiredDate.getTime()) || requiredDate.toISOString().slice(0, 10) !== requiredDateInput) {
    return { error: "Please enter a valid required date." };
  }

  if (requiredTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(requiredTime)) {
    return { error: "Please enter a valid required time." };
  }

  if ((latitudeInput && !longitudeInput) || (!latitudeInput && longitudeInput)) return { error: "Please select a valid map location." };
  const latitude = latitudeInput ? Number(latitudeInput) : null;
  const longitude = longitudeInput ? Number(longitudeInput) : null;
  if (
    (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
    (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
  ) return { error: "Please select a valid map location." };
  const locationLink = latitude !== null && longitude !== null
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null;

  if (preferredVehicleId.length > 191) return { error: "Please select a valid preferred vehicle." };
  const preferredVehicle = preferredVehicleId
    ? await prisma.vehicle.findFirst({ where: { id: preferredVehicleId, isActive: true, isPublic: true }, select: { id: true, name: true, vehicleNumber: true, vehicleType: true } })
    : null;
  if (preferredVehicleId && !preferredVehicle) return { error: "The preferred vehicle selected is no longer available. Please choose another vehicle or No Preference." };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = requestCode();
    try {
      const created = await prisma.serviceRequest.create({
        data: {
          requestCode: code,
          requesterName,
          mobileNumber,
          alternativeNumber: optional(alternativeNumber),
          relationshipToDeceased: optional(relationshipToDeceased),
          serviceType,
          preferredVehicleId: preferredVehicle?.id ?? null,
          requiredDate,
          requiredTime: optional(requiredTime),
          placeType,
          address,
          area,
          locationLink,
          latitude,
          longitude,
          hospitalName: optional(hospitalName),
          note: optional(note),
          status: "NEW",
        },
        include: { preferredVehicle: { select: { name: true, vehicleNumber: true, vehicleType: true } } },
      });
      try {
        const pdf = await createRequestConfirmationPdf(created);
        return { requestCode: code, status: "NEW", pdfBase64: Buffer.from(pdf).toString("base64") };
      } catch (pdfError) {
        console.error("Unable to generate request confirmation PDF", pdfError);
        return { requestCode: code, status: "NEW" };
      }
    } catch (error) {
      const isRequestCodeCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        String(error.meta?.target ?? "").includes("requestCode");
      if (!isRequestCodeCollision) throw error;
    }
  }

  return { error: "Unable to create a request code. Please try again." };
}
