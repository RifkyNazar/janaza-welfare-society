import type { Metadata } from "next";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = { title: "Admin Login" };

export default function AdminLoginPage() {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-12">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(69,232,205,0.16),transparent_24rem),radial-gradient(circle_at_88%_78%,rgba(168,245,232,0.2),transparent_25rem),linear-gradient(145deg,#fff_0%,#f4fffc_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[0.035] [background-image:linear-gradient(45deg,transparent_47%,#45E8CD_48%_52%,transparent_53%),linear-gradient(-45deg,transparent_47%,#45E8CD_48%_52%,transparent_53%)] [background-size:64px_64px]" />

      <div className="w-full max-w-md">
        <div className="text-center">
          <div aria-hidden="true" className="mx-auto flex size-16 items-center justify-center rounded-t-[2rem] rounded-b-2xl border border-primary/40 bg-white shadow-[0_8px_28px_rgba(16,42,42,0.08)]">
            <span className="size-3 rotate-45 border border-primary bg-primary/20" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-muted">Janaza Welfare Society</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">Admin Login</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Secure access for approved administrators.</p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-[0_18px_55px_rgba(16,42,42,0.1)] sm:p-8">
          <AdminLoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/" className="font-semibold underline decoration-primary decoration-2 underline-offset-4 hover:text-foreground">Return to public website</Link>
        </p>
      </div>
    </main>
  );
}
