import type { ReactNode } from "react";
import { signOut } from "@/auth";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { PortalShell } from "@/components/portal-shell";
import { requireAdmin } from "@/lib/permissions";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <PortalShell title="Admin Portal" heading="Administration" identity={session.user.email} logout={logout} navigation={<AdminNavigation />}>
      {children}
    </PortalShell>
  );
}
