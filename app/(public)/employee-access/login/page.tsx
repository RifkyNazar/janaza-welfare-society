import type { Metadata } from "next";
import { EmployeeAuthLayout } from "@/components/employee/employee-auth-layout";
import { LoginForm } from "@/components/employee/login-form";
import { redirectAuthenticatedUser } from "@/lib/permissions";

export const metadata: Metadata = { title: "Employee Login" };

export default async function EmployeeLoginPage() {
  await redirectAuthenticatedUser();
  return (
    <EmployeeAuthLayout title="Staff Login" description="Sign in to your approved Supervisor or Employee account." backHref="/employee-access" backLabel="Back to Staff Access">
      <LoginForm />
    </EmployeeAuthLayout>
  );
}
