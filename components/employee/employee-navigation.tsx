import { PortalNavigation } from "@/components/portal-navigation";

const items = [
  ["Dashboard", "/employee"],
  ["My Tasks", "/employee/my-tasks"],
  ["Completed Tasks", "/employee/completed"],
  ["Profile", "/employee/profile"],
  ["Availability", "/employee#availability"],
] as const;

export function EmployeeNavigation() {
  return <PortalNavigation label="Employee navigation" items={items} />;
}
