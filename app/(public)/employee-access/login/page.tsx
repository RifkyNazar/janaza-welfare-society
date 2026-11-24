import type { Metadata } from "next";
import { EmployeeAuthLayout } from "@/components/employee/employee-auth-layout";
import { EmployeePinForm } from "@/components/employee/pin-form";
import { redirectAuthenticatedUser } from "@/lib/permissions";

export const metadata: Metadata = { title: "Employee Login" };

export default async function EmployeeLoginPage() {
  await redirectAuthenticatedUser(["EMPLOYEE"]);
  return (
    <EmployeeAuthLayout title="Employee Login" description="Use your phone number and six-digit login code.">
      <EmployeePinForm />
    </EmployeeAuthLayout>
  );
}
