import type { Metadata } from "next";
import { EmployeeAuthLayout } from "@/components/employee/employee-auth-layout";
import { LoginForm } from "@/components/employee/login-form";

export const metadata: Metadata = { title: "Employee Login" };

export default function EmployeeLoginPage() {
  return (
    <EmployeeAuthLayout title="Employee Login" description="Sign in to your authorized employee account." backHref="/employee-access" backLabel="Back to Employee Access">
      <LoginForm />
    </EmployeeAuthLayout>
  );
}
