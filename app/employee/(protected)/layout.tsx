import type { ReactNode } from "react";
import { signOut } from "@/auth";
import { EmployeeNavigation } from "@/components/employee/employee-navigation";
import { requireEmployee } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function EmployeeLayout({ children }: { children: ReactNode }) {
  const session = await requireEmployee();
  const availableCount = await prisma.serviceRequest.count({ where: { status: "NEW", taskAssignment: null } });

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/employee-access/login" });
  }

  return (
    <div className="min-h-screen bg-[#f6fbfa] text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-white p-6 md:block">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Janaza Welfare</p>
        <p className="mt-2 text-xl font-semibold">Employee Portal</p>
        <div className="mt-5 h-px bg-gradient-to-r from-primary to-transparent" />
        <EmployeeNavigation availableCount={availableCount} />
      </aside>

      <div className="md:pl-64">
        <header className="border-b border-border bg-white">
          <div className="flex min-h-18 items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Employee Operations</p>
              <p className="mt-1 text-sm text-muted">{session.user.fullName ?? session.user.email}</p>
            </div>
            <form action={logout}>
              <button type="submit" className="rounded-full border border-border px-5 py-2 text-sm font-semibold transition hover:border-primary hover:bg-light-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Logout</button>
            </form>
          </div>
          <div className="border-t border-border md:hidden"><EmployeeNavigation mobile availableCount={availableCount} /></div>
        </header>
        <main className="p-5 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
