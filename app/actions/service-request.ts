"use server";

import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createRequestConfirmationPdf } from "@/lib/request-confirmation-pdf";
import { validateServiceSelection } from "@/lib/service-options";
import { notifyStaffOfNewServiceRequest } from "@/lib/notifications";

export type ServiceRequestFormValues = { requesterName: string; mobileNumber: string; area: string; note: string; category: string; serviceCodes: string[]; latitude: string; longitude: string };
export type ServiceRequestActionState = { error?: string; fieldErrors?: Partial<Record<"requesterName" | "mobileNumber" | "area" | "services" | "location", string>>; requestCode?: string; status?: "NEW"; pdfBase64?: string; selectedServices?: string[]; values?: ServiceRequestFormValues };

function text(formData: FormData, name: string) { const entry = formData.get(name); return typeof entry === "string" ? entry.trim() : ""; }
function requestCode() { return `JWS-REQ-${new Date().getFullYear()}-${randomBytes(5).toString("hex").toUpperCase()}`; }

export async function submitServiceRequest(_previousState: ServiceRequestActionState, formData: FormData): Promise<ServiceRequestActionState> {
  void _previousState;
  const requesterName = text(formData, "requesterName");
  const mobileNumber = text(formData, "mobileNumber");
  const area = text(formData, "area");
  const note = text(formData, "note");
  const category = text(formData, "serviceCategory");
  const submittedCodes = formData.getAll("serviceCodes").filter((value): value is string => typeof value === "string");
  const latitudeInput = text(formData, "latitude"); const longitudeInput = text(formData, "longitude");
  const values = { requesterName, mobileNumber, area, note, category, serviceCodes: submittedCodes, latitude: latitudeInput, longitude: longitudeInput };
  if (!requesterName || !mobileNumber || !area) return { error: "Please correct the highlighted fields.", fieldErrors: { ...(!requesterName ? { requesterName: "Enter your name." } : {}), ...(!mobileNumber ? { mobileNumber: "Enter your contact number." } : {}), ...(!area ? { area: "Enter your location or area." } : {}) }, values };
  if (requesterName.length > 150 || mobileNumber.length > 30 || area.length > 150 || note.length > 2000) return { error: "One or more fields exceed the allowed length.", values };
  if (!/^[+]?[0-9][0-9\s-]{7,20}$/.test(mobileNumber)) return { error: "Please correct the highlighted field.", fieldErrors: { mobileNumber: "Enter a valid contact number." }, values };
  const selectedServices = validateServiceSelection(category, submittedCodes);
  if (!selectedServices) return { error: category === "VEHICLE" ? "Please select exactly one valid vehicle service." : "Please select one or more valid Janazah services.", values };

  if ((latitudeInput && !longitudeInput) || (!latitudeInput && longitudeInput)) return { error: "Please select a valid map location.", values };
  const latitude = latitudeInput ? Number(latitudeInput) : null;
  const longitude = longitudeInput ? Number(longitudeInput) : null;
  if ((latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) || (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))) return { error: "Please select a valid map location.", values };

  const labels = selectedServices.map((service) => service.label);
  const serviceType = category === "JANAZAH" && selectedServices.length > 1 ? "Multiple Janazah Services" : labels[0];
  const now = new Date();
  const locationLink = latitude !== null && longitude !== null ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = requestCode();
    try {
      const created = await prisma.$transaction(async (tx) => tx.serviceRequest.create({
        data: {
          requestCode: code, requesterName, mobileNumber, serviceCategory: category as "JANAZAH" | "VEHICLE", serviceType,
          preferredVehicleId: null, requiredDate: now, placeType: "OTHER", address: area, area, locationLink, latitude, longitude,
          note: note || null, status: "NEW",
          serviceSelections: { create: selectedServices.map((service) => ({ serviceCode: service.code, serviceLabel: service.label })) },
        },
        include: { serviceSelections: { orderBy: { id: "asc" } } },
      }));
      try {
        await notifyStaffOfNewServiceRequest({
          requestId: created.id,
          requestCode: created.requestCode,
          category: category === "JANAZAH" ? "Janazah Services" : "Vehicle Services",
          services: created.serviceSelections.map((service) => service.serviceLabel),
          area: created.area,
          submittedAt: created.createdAt,
        });
      } catch {
        console.error("[email] Service request notification failed after request creation completed.");
      }
      try {
        const pdf = await createRequestConfirmationPdf(created);
        return { requestCode: code, status: "NEW", selectedServices: labels, pdfBase64: Buffer.from(pdf).toString("base64") };
      } catch (pdfError) { console.error("Unable to generate request confirmation PDF", pdfError); return { requestCode: code, status: "NEW", selectedServices: labels }; }
    } catch (error) {
      const collision = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && String(error.meta?.target ?? "").includes("requestCode");
      if (!collision) { console.error("Unable to create service request", error); return { error: "Unable to submit your request right now. Please try again.", values }; }
    }
  }
  return { error: "Unable to create a request code. Please try again.", values };
}
