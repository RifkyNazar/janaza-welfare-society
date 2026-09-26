import "server-only";

import { prisma } from "@/lib/prisma";
import { getEmailAppBaseUrl, sendEmailNotification } from "@/lib/notifications/email";
import { sendPushToApprovedRole, sendPushToApprovedUser } from "@/lib/notifications/push";
import { employeeRegistrationEmail, serviceRequestEmail, taskAssignmentEmail } from "@/lib/notifications/templates";
import type { EmployeeRegistrationNotification, ServiceRequestNotification } from "@/lib/notifications/types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function uniqueValidEmails(values: string[]) {
  return [...new Set(values.map((email) => email.trim().toLowerCase()).filter((email) => emailPattern.test(email)))];
}

async function sendIndividually(recipients: string[], message: Omit<Parameters<typeof sendEmailNotification>[0], "to">) {
  const emails = uniqueValidEmails(recipients);
  const results = await Promise.allSettled(emails.map((to) => sendEmailNotification({ to, ...message })));
  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed > 0) console.error(`[email] ${failed} of ${emails.length} notification deliveries failed.`);
}

export async function notifyAssignedEmployee(taskAssignmentId: number) {
  try {
    const task = await prisma.taskAssignment.findFirst({
      where: { id: taskAssignmentId, isActive: true, employee: { user: { role: "EMPLOYEE", status: "APPROVED" } } },
      select: { id: true, employee: { select: { userId: true, user: { select: { email: true } } } }, request: { select: { requestCode: true, serviceCategory: true, serviceType: true, area: true, serviceSelections: { select: { serviceLabel: true }, orderBy: { id: "asc" } } } } },
    });
    if (!task) return;
    const data = { requestCode: task.request.requestCode, category: task.request.serviceCategory === "JANAZAH" ? "Janazah Services" : task.request.serviceCategory === "VEHICLE" ? "Vehicle Services" : task.request.serviceType, services: task.request.serviceSelections.length ? task.request.serviceSelections.map((item) => item.serviceLabel) : [task.request.serviceType], area: task.request.area };
    const deliveries: Promise<unknown>[] = [sendPushToApprovedUser(task.employee.userId, "EMPLOYEE", { title: "JWS New Task Assignment", body: "You have been assigned a new JWS service task. Open JWS to view the details.", url: `/employee/my-tasks/${task.id}`, tag: `task-assignment-${task.id}` })];
    const appBaseUrl = getEmailAppBaseUrl();
    if (appBaseUrl && emailPattern.test(task.employee.user.email)) deliveries.push(sendEmailNotification({ to: task.employee.user.email, ...taskAssignmentEmail(data, `${appBaseUrl}/employee/my-tasks/${task.id}`) }));
    await Promise.allSettled(deliveries);
  } catch { console.error("[notifications] Task assignment notification could not be completed."); }
}

export async function notifyAdminsOfEmployeeRegistration(data: EmployeeRegistrationNotification) {
  try {
    const deliveries: Promise<unknown>[] = [sendPushToApprovedRole("ADMIN", { title: "New Employee Registration", body: "A new employee registration requires administrator approval.", url: `/admin/employees/${data.employeeId}`, tag: `employee-registration-${data.employeeId}` })];
    const appBaseUrl = getEmailAppBaseUrl();
    if (appBaseUrl) {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN", status: "APPROVED", email: { not: "" } }, select: { email: true } });
      deliveries.push(sendIndividually(admins.map(({ email }) => email), employeeRegistrationEmail(data, `${appBaseUrl}/admin/employees/${data.employeeId}`)));
    }
    await Promise.allSettled(deliveries);
  } catch { console.error("[notifications] Employee registration notification could not be completed."); }
}

export async function notifySupervisorsOfNewServiceRequest(data: ServiceRequestNotification) {
  try {
    const deliveries: Promise<unknown>[] = [sendPushToApprovedRole("SUPERVISOR", { title: "New JWS Service Request", body: `${data.requestCode} • ${data.category} • New request waiting for assignment.`, url: `/supervisor/requests/${data.requestId}`, tag: `service-request-${data.requestId}` })];
    const appBaseUrl = getEmailAppBaseUrl();
    if (appBaseUrl) {
      const supervisors = await prisma.user.findMany({ where: { role: "SUPERVISOR", status: "APPROVED", email: { not: "" } }, select: { email: true } });
      deliveries.push(sendIndividually(supervisors.map(({ email }) => email), serviceRequestEmail(data, `${appBaseUrl}/supervisor/requests/${data.requestId}`)));
    }
    await Promise.allSettled(deliveries);
  } catch { console.error("[notifications] Service request notification could not be completed."); }
}
