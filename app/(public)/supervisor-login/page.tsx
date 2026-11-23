import type { Metadata } from "next";
import { EmployeeAuthLayout } from "@/components/employee/employee-auth-layout";
import { LoginForm } from "@/components/employee/login-form";
import { redirectAuthenticatedUser } from "@/lib/permissions";

export const metadata: Metadata = { title: "Supervisor Login" };

export default async function SupervisorLoginPage() {
  await redirectAuthenticatedUser(["SUPERVISOR", "ADMIN"]);
  return <EmployeeAuthLayout title="Supervisor Login" description="Sign in with your supervisor email or staff ID and password.">
    <LoginForm />
  </EmployeeAuthLayout>;
}
