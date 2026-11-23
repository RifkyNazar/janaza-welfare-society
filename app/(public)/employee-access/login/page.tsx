import type { Metadata } from "next";
import { EmployeeAuthLayout } from "@/components/employee/employee-auth-layout";
import { EmployeePinForm } from "@/components/employee/pin-form";
import { T } from "@/components/public-language";
import { redirectAuthenticatedUser } from "@/lib/permissions";

export const metadata: Metadata = { title: "Employee Login" };

export default async function EmployeeLoginPage({ searchParams }: { searchParams: Promise<{ pinSet?: string }> }) {
  await redirectAuthenticatedUser(["EMPLOYEE"]);
  return (
    <EmployeeAuthLayout title="Employee Login" description="Use your verified phone number and PIN to sign in." backHref="/employee-access" backLabel="Back to Employee Access">
      {(await searchParams).pinSet === "1" && <p role="status" className="mb-4 font-semibold"><T text="PIN saved. You can now sign in." /></p>}
      <EmployeePinForm />
    </EmployeeAuthLayout>
  );
}
