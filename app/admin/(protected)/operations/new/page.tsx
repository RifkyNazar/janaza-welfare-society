import { addOperation } from "@/app/actions/public-operation";
import { OperationForm } from "@/components/admin/operation-form";
import { T } from "@/components/public-language";
import { requireAdmin } from "@/lib/permissions";

export default async function NewOperationPage() {
  await requireAdmin();
  return <div className="mx-auto max-w-3xl"><h1 className="text-3xl font-semibold"><T text="Add Operation" /></h1>
    <OperationForm action={addOperation.bind(null, "admin")} />
  </div>;
}
