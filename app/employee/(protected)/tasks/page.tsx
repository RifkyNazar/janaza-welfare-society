import { redirect } from "next/navigation";
import { requireEmployee } from "@/lib/permissions";

export default async function AvailableTasksPage() {
  await requireEmployee();
  redirect("/employee/my-tasks");
}
