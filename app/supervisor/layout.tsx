import type { ReactNode } from "react";
import { signOut } from "@/auth";
import { SupervisorNavigation } from "@/components/supervisor/supervisor-navigation";
import { PortalShell } from "@/components/portal-shell";
import { requireAdminOrSupervisor } from "@/lib/permissions";

export default async function SupervisorLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminOrSupervisor();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/supervisor-login" });
  }

  return (
    <PortalShell title="Supervisor Portal" heading="Operations & Dispatch" identity={session.user.fullName ?? session.user.email} logout={logout} navigation={<SupervisorNavigation />}>
      {children}
    </PortalShell>
  );
}
