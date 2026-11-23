export const EMPLOYEE_SESSION_HOURS = 12;
export const REMEMBERED_EMPLOYEE_SESSION_DAYS = 90;

export function employeeSessionExpiry(remember: boolean, now = Date.now()) {
  const hours = remember ? REMEMBERED_EMPLOYEE_SESSION_DAYS * 24 : EMPLOYEE_SESSION_HOURS;
  return new Date(Math.floor(now / 1000) * 1000 + hours * 3_600_000);
}
