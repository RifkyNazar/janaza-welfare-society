import { requireAdmin } from "@/lib/permissions";
import { T } from "@/components/public-language";
import { AdminEmployeeForm } from "@/components/admin/employee-form";
import { saveEmployee } from "../actions";

export default async function AddEmployeePage() {
  await requireAdmin();
  return <div className="mx-auto max-w-3xl"><h1 className="text-3xl font-semibold"><T text="Add Employee" /></h1>
    <AdminEmployeeForm action={saveEmployee.bind(null, null)} />
  </div>;
}
