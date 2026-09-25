import type { Metadata } from "next";
import { EmployeeAuthLayout } from "@/components/employee/employee-auth-layout";
import { RegistrationForm } from "@/components/employee/registration-form";
import { redirectAuthenticatedUser } from "@/lib/permissions";

export const metadata: Metadata = { title: "Employee Registration" };

const reviewSteps = ["Register", "Admin Review", "Account Approved"];

function StepIcon({ index }: { index: number }) {
  return (
    <span className="employee-step-icon flex size-10 items-center justify-center text-sm font-semibold text-foreground ring-1 ring-primary/50">
      {index + 1}
    </span>
  );
}

export default async function EmployeeRegistrationPage() {
  await redirectAuthenticatedUser();
  return (
    <EmployeeAuthLayout title="Employee Registration" description="Submit your information for administrator approval." backHref="/employee-access" backLabel="Back to Employee Access" wide>
      <div className="mx-auto mb-7 max-w-2xl rounded-2xl border border-border bg-white/80 p-5 shadow-sm">
        <ol className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          {reviewSteps.map((step, index) => (
            <li key={step} className="contents">
              <div className="flex items-center gap-3 sm:flex-col sm:text-center">
                <StepIcon index={index} />
                <span className="text-sm font-semibold text-foreground">{step}</span>
              </div>
              {index < reviewSteps.length - 1 && <span aria-hidden="true" className="pl-4 text-primary sm:pl-0 sm:text-center">↓</span>}
            </li>
          ))}
        </ol>
      </div>

      <RegistrationForm />
    </EmployeeAuthLayout>
  );
}
