import type { ReactNode } from "react";
import { signOut } from "@/auth";
import { SupervisorNavigation } from "@/components/supervisor/supervisor-navigation";
import { requireAdminOrSupervisor } from "@/lib/permissions";

export default async function SupervisorLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminOrSupervisor();
  async function logout() { "use server"; await signOut({ redirectTo: "/employee-access/login" }); }
  return <div className="min-h-screen bg-[#f6fbfa] text-foreground"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-white p-6 md:block"><p className="text-xs font-semibold uppercase tracking-[.2em] text-muted">Janaza Welfare</p><p className="mt-2 text-xl font-semibold">Supervisor Portal</p><SupervisorNavigation /></aside><div className="md:pl-64"><header className="border-b border-border bg-white"><div className="flex min-h-18 items-center justify-between gap-4 px-5 py-4 sm:px-8"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Operations & Dispatch</p><p className="mt-1 text-sm text-muted">{session.user.fullName ?? session.user.email}</p></div><form action={logout}><button className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold">Logout</button></form></div><div className="border-t border-border md:hidden"><SupervisorNavigation mobile /></div></header><main className="p-5 sm:p-8 lg:p-10">{children}</main></div></div>;
}
