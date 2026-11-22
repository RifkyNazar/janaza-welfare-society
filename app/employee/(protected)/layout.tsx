import type { ReactNode } from "react";
import { signOut } from "@/auth";
import { EmployeeNavigation } from "@/components/employee/employee-navigation";
import { PortalShell } from "@/components/portal-shell";
import { requireEmployee } from "@/lib/permissions";

export default async function EmployeeLayout({ children }: { children: ReactNode }) {
  const session = await requireEmployee();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/employee-access/login" });
  }

  return (
    <PortalShell title="Employee Portal" heading="Employee Operations" identity={session.user.fullName ?? session.user.email} logout={logout} navigation={<EmployeeNavigation />}>
      {children}
    </PortalShell>
  );
}
