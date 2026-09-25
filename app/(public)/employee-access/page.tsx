import type { Metadata } from "next";
import Link from "next/link";
import { EmployeeAuthLayout } from "@/components/employee/employee-auth-layout";
import { redirectAuthenticatedUser } from "@/lib/permissions";

export const metadata: Metadata = { title: "Employee Access" };

const accessOptions = [
  {
    title: "Employee Login",
    description: "Already have an approved employee account?",
    action: "Login",
    href: "/employee-access/login",
    icon: "key",
  },
  {
    title: "Employee Registration",
    description: "Submit your details to request an employee account.",
    action: "Register",
    href: "/employee-access/register",
    icon: "person",
  },
] as const;

function AccessIcon({ icon }: { icon: (typeof accessOptions)[number]["icon"] }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-7">
      {icon === "key" ? (
        <path d="M14 8a5 5 0 1 1-1.4 3.45L21 3m-3 3 2 2m-5-1 2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0m14-7v6m-3-3h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default async function EmployeeAccessPage() {
  await redirectAuthenticatedUser();
  return (
    <EmployeeAuthLayout title="Employee Access" description="Secure access for authorized Janaza Welfare Society staff members." wide>
      <div className="grid gap-6 md:grid-cols-2">
        {accessOptions.map((option) => (
          <article key={option.href} className="employee-access-card group rounded-2xl border border-border bg-white p-7 shadow-[0_12px_35px_rgba(16,42,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_18px_45px_rgba(69,232,205,0.16)]">
            <div className="employee-card-icon flex size-14 items-center justify-center bg-light-background text-foreground ring-1 ring-primary/45">
              <AccessIcon icon={option.icon} />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-foreground">{option.title}</h2>
            <p className="mt-3 leading-7 text-muted">{option.description}</p>
            <Link href={option.href} className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-foreground transition duration-300 group-hover:shadow-[0_8px_24px_rgba(69,232,205,0.28)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
              {option.action}
              <span className="cta-gem" aria-hidden="true" />
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none">→</span>
            </Link>
          </article>
        ))}
      </div>

      <aside className="mt-6 flex gap-3 rounded-2xl border border-primary/30 bg-white/80 p-4 text-sm leading-6 text-muted shadow-sm">
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="mt-0.5 size-5 shrink-0 text-primary">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 9v5m0-8v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <p>New employee registrations require administrator approval before access is granted.</p>
      </aside>
    </EmployeeAuthLayout>
  );
}
