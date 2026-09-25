import { redirect } from "next/navigation";
import { requireEmployee } from "@/lib/permissions";

export default async function AvailableTaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireEmployee();
  void params;
  redirect("/employee/my-tasks");
}
