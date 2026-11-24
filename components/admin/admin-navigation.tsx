import { PortalNavigation } from "@/components/portal-navigation";

const groups = [
  ["Dashboard", [["Overview", "/admin"]]],
  ["Service Management", [["Requests", "/admin/service-requests"], ["Task Assignments", "/admin/task-assignments"]]],
  ["People", [["Employees", "/admin/employees"], ["Supervisors", "/admin/supervisors"], ["Operational Team", "/admin/operational-team"]]],
  ["Website Content", [["Operations", "/admin/operations"], ["Hero Images", "/admin/hero-media"], ["Advertisements", "/admin/advertisements"]]],
  ["Finance", [["Donations", "/admin/donations"]]],
  ["Settings", [["Browser Notifications", "/admin#notifications"], ["View Website", "/"]]],
] as const;

export function AdminNavigation() {
  return <PortalNavigation label="Admin navigation" groups={groups} />;
}
