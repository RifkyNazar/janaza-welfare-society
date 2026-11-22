import { PortalNavigation } from "@/components/portal-navigation";

const items = [
  ["Dashboard", "/supervisor"],
  ["Requests / Dispatch", "/supervisor/requests"],
  ["Tasks", "/supervisor/tasks"],
  ["Employees", "/supervisor/employees"],
  ["Vehicles", "/supervisor/vehicles"],
] as const;

export function SupervisorNavigation() {
  return <PortalNavigation label="Supervisor navigation" items={items} />;
}
