export const JANAZAH_SERVICE_OPTIONS = [
  { code: "JANAZAH_KAFAN", label: "Kafan (Shroud)", description: "Shroud preparation support" },
  { code: "JANAZAH_GRAVE", label: "Grave (Qabr)", description: "Grave preparation support" },
  { code: "JANAZAH_MANJI", label: "Manji", description: "Funeral bier support" },
  { code: "JANAZAH_CHAIR", label: "Chair", description: "Seating support" },
  { code: "JANAZAH_GHUSL", label: "Ghusl (Washing of the Deceased)", description: "Washing support" },
  { code: "JANAZAH_LIGHTING", label: "Lighting Facilities", description: "Lighting support" },
] as const;

export const VEHICLE_SERVICE_OPTIONS = [
  { code: "VEHICLE_JANAZAH_TRANSPORT", label: "Janazah Transportation", description: "Transport for the deceased" },
  { code: "VEHICLE_PATIENT_TRANSPORT", label: "Patient Transportation", description: "Patient transport assistance" },
  { code: "VEHICLE_HOSPITAL_TRANSPORT", label: "Hospital Transportation", description: "Transport to or from hospital" },
] as const;

export const SERVICE_OPTIONS = [...JANAZAH_SERVICE_OPTIONS, ...VEHICLE_SERVICE_OPTIONS] as const;
export type PublicServiceCategory = "JANAZAH" | "VEHICLE";
export type ServiceOptionCode = (typeof SERVICE_OPTIONS)[number]["code"];

const definitions = new Map<string, (typeof SERVICE_OPTIONS)[number]>(SERVICE_OPTIONS.map((option) => [option.code, option]));
const janazahCodes = new Set<string>(JANAZAH_SERVICE_OPTIONS.map((option) => option.code));
const vehicleCodes = new Set<string>(VEHICLE_SERVICE_OPTIONS.map((option) => option.code));

export function validateServiceSelection(category: string, submittedCodes: string[]) {
  if (category !== "JANAZAH" && category !== "VEHICLE") return null;
  const codes = [...new Set(submittedCodes.map((code) => code.trim()).filter(Boolean))];
  if (category === "JANAZAH" && (codes.length < 1 || codes.some((code) => !janazahCodes.has(code)))) return null;
  if (category === "VEHICLE" && (codes.length !== 1 || codes.some((code) => !vehicleCodes.has(code)))) return null;
  return codes.map((code) => definitions.get(code)!);
}

export function categoryLabel(category: PublicServiceCategory | null | undefined) {
  return category === "JANAZAH" ? "Janazah Service" : category === "VEHICLE" ? "Vehicle Service" : "Legacy Request";
}

export function serviceSummary(serviceType: string, selections: Array<{ serviceLabel: string }>) {
  return selections.length ? selections.map((selection) => selection.serviceLabel).join(", ") : serviceType;
}
