import Link from "next/link";
import { EmployeeAuthLayout } from "@/components/employee/employee-auth-layout";
import { T } from "@/components/public-language";

export default function PinResetPage() {
  return <EmployeeAuthLayout title="Reset PIN" description="Contact JWS to verify your identity and request a new one-time setup token."
    backHref="/employee-access/login" backLabel="Back to Employee Login">
    <div className="space-y-4 rounded-2xl border border-border bg-white p-6">
      <p><T text="JWS can also help if your registration is pending, rejected, or your account is disabled." /></p>
      <div className="flex flex-wrap gap-5 text-sm font-semibold">
        <Link className="underline" href="/contact"><T text="Contact JWS" /></Link>
        <Link className="underline" href="/employee-access/pin-setup"><T text="Set up PIN" /></Link>
      </div>
    </div>
  </EmployeeAuthLayout>;
}
