import { addOperation } from "@/app/actions/public-operation";
import { OperationForm } from "@/components/admin/operation-form";
import { T } from "@/components/public-language";
import { requireEmployee } from "@/lib/permissions";

export default async function EmployeeOperationPage({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  await requireEmployee();
  return <div className="mx-auto max-w-3xl"><h1 className="text-3xl font-semibold"><T text="Add Operation" /></h1>
    {(await searchParams).added === "1" && <p role="status" className="mt-4"><T text="Operation added." /></p>}
    <OperationForm action={addOperation.bind(null, "employee")} />
  </div>;
}
