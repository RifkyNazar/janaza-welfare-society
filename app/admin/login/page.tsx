import { LanguageSelector, T } from "@/components/public-language";
import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { redirectAuthenticatedUser } from "@/lib/permissions";
import { BackButton } from "@/components/back-button";
import { PortalValidation } from "@/components/portal-validation";

export const metadata: Metadata = { title: "Admin Login" };

export default async function AdminLoginPage() {
  await redirectAuthenticatedUser(["ADMIN"]);
  return (
    <main className="jws-portal relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-12">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(8,127,35,0.16),transparent_24rem),radial-gradient(circle_at_88%_78%,rgba(168,245,232,0.2),transparent_25rem),linear-gradient(145deg,#fff_0%,#f3f8f3_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[0.035] [background-image:linear-gradient(45deg,transparent_47%,var(--primary)_48%_52%,transparent_53%),linear-gradient(-45deg,transparent_47%,var(--primary)_48%_52%,transparent_53%)] [background-size:64px_64px]" />

      <div className="w-full min-w-0 max-w-md">
        <div className="mb-4 flex justify-end"><LanguageSelector /></div>
        <div className="text-center">
          <div aria-hidden="true" className="mx-auto flex size-16 items-center justify-center rounded-t-[2rem] rounded-b-2xl border border-primary/40 bg-white shadow-[0_8px_28px_rgba(16,42,42,0.08)]">
            <span className="size-3 rotate-45 border border-primary bg-primary/20" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-muted"><T text="Janaza Welfare Society" /></p>
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl tracking-tight text-foreground"><T text="Admin Login" /></h1>
          <p className="mt-3 text-sm leading-6 text-muted"><T text="Secure access for approved administrators." /></p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-[0_18px_55px_rgba(16,42,42,0.1)] sm:p-8">
          <PortalValidation><AdminLoginForm /></PortalValidation>
        </div>

        <div className="mt-6 text-center"><BackButton fallbackHref="/" /></div>
      </div>
    </main>
  );
}
