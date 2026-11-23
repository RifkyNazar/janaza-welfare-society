export function normalizeEmployeePhone(input: string) {
  if (input.length > 32 || !/^[+\d\s()-]+$/.test(input)) return null;
  const compact = input.replace(/[\s()-]/g, "");
  const national = compact.replace(/^(?:\+94|0094|94(?=\d{9}$)|0)/, "");
  return /^[1-9]\d{8}$/.test(national) ? `+94${national}` : null;
}

export const isEmployeePin = (value: string) => /^\d{6}$/.test(value);
export const PIN_ONLY_EMAIL_SUFFIX = "@employee.invalid";
export const NO_STAFF_PASSWORD = "!";
