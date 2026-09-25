import "server-only";

import { prisma } from "@/lib/prisma";
import { getEmailAppBaseUrl, sendEmailNotification } from "@/lib/notifications/email";
import { employeeRegistrationEmail, serviceRequestEmail, taskAssignmentEmail } from "@/lib/notifications/templates";
import type { EmployeeRegistrationNotification, ServiceRequestNotification } from "@/lib/notifications/types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function uniqueValidEmails(values: string[]) {
  return [...new Set(values.map((email) => email.trim().toLowerCase()).filter((email) => emailPattern.test(email)))];
}

export async function notifyAssignedEmployee(taskAssignmentId: number) {
  try {
    const appBaseUrl = getEmailAppBaseUrl(); if (!appBaseUrl) return;
    const task = await prisma.taskAssignment.findFirst({ where: { id: taskAssignmentId, isActive: true, employee: { user: { role: "EMPLOYEE", status: "APPROVED" } } }, select: { id: true, employee: { select: { user: { select: { email: true } } } }, request: { select: { requestCode: true, serviceCategory: true, serviceType: true, area: true, serviceSelections: { select: { serviceLabel: true }, orderBy: { id: "asc" } } } } } });
    if (!task || !emailPattern.test(task.employee.user.email)) return;
    const data = { requestCode: task.request.requestCode, category: task.request.serviceCategory === "JANAZAH" ? "Janazah Services" : task.request.serviceCategory === "VEHICLE" ? "Vehicle Services" : task.request.serviceType, services: task.request.serviceSelections.length ? task.request.serviceSelections.map(item => item.serviceLabel) : [task.request.serviceType], area: task.request.area };
    await sendEmailNotification({ to: task.employee.user.email, ...taskAssignmentEmail(data, `${appBaseUrl}/employee/my-tasks/${task.id}`) });
  } catch { console.error("[email] Task assignment notification could not be completed."); }
}

async function sendIndividually(recipients: string[], message: Omit<Parameters<typeof sendEmailNotification>[0], "to">) {
  const emails = uniqueValidEmails(recipients);
  const results = await Promise.allSettled(emails.map((to) => sendEmailNotification({ to, ...message })));
  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed > 0) console.error(`[email] ${failed} of ${emails.length} notification deliveries failed.`);
}

export async function notifyAdminsOfEmployeeRegistration(data: EmployeeRegistrationNotification) {
  try {
    const appBaseUrl = getEmailAppBaseUrl();
    if (!appBaseUrl) return;
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "APPROVED", email: { not: "" } },
      select: { email: true },
    });
    const message = employeeRegistrationEmail(data, `${appBaseUrl}/admin/employees/${data.employeeId}`);
    await sendIndividually(admins.map(({ email }) => email), message);
  } catch {
    console.error("[email] Employee registration notification could not be completed.");
  }
}

export async function notifyStaffOfNewServiceRequest(data: ServiceRequestNotification) {
  try {
    const appBaseUrl = getEmailAppBaseUrl();
    if (!appBaseUrl) return;
    const users = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPERVISOR"] }, status: "APPROVED", email: { not: "" } },
      select: { email: true, role: true },
    });
    const recipients = new Map<string, "ADMIN" | "SUPERVISOR">();
    for (const user of users) {
      const email = user.email.trim().toLowerCase();
      if (emailPattern.test(email) && !recipients.has(email)) recipients.set(email, user.role === "ADMIN" ? "ADMIN" : "SUPERVISOR");
    }
    const deliveries = [...recipients].map(([to, role]) => {
      const path = role === "ADMIN" ? `/admin/service-requests/${data.requestId}` : `/supervisor/requests/${data.requestId}`;
      return sendEmailNotification({ to, ...serviceRequestEmail(data, `${appBaseUrl}${path}`) });
    });
    const results = await Promise.allSettled(deliveries);
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed > 0) console.error(`[email] ${failed} of ${deliveries.length} service request notification deliveries failed.`);
  } catch {
    console.error("[email] Service request notification could not be completed.");
  }
}
