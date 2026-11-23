import { EmployeeAuthLayout } from "@/components/employee/employee-auth-layout";
import { EmployeePinForm } from "@/components/employee/pin-form";

export default function PinSetupPage() {
  return <EmployeeAuthLayout title="Set up PIN" description="After verifying your identity, a JWS administrator will give you a one-time setup token."
    backHref="/employee-access/login" backLabel="Back to Employee Login">
    <EmployeePinForm setup />
  </EmployeeAuthLayout>;
}
