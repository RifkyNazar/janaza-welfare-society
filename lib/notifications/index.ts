import "server-only";

import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getEmailAppBaseUrl, sendEmailNotification } from "@/lib/notifications/email";
import { sendPushToApprovedUser, sendPushToApprovedUsers } from "@/lib/notifications/push";
import { getSmsAppBaseUrl, sendSmsNotification } from "@/lib/notifications/sms";
import { employeeRegistrationEmail, serviceRequestEmail, taskAssignmentEmail } from "@/lib/notifications/templates";
import type { EmployeeRegistrationNotification, ServiceRequestNotification } from "@/lib/notifications/types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STAFF_REGISTRATION_SMS = "JWS: New employee registration received. Please sign in to review.";
const STAFF_REQUEST_SMS = "JWS: New service request received. Please sign in to review.";
const ASSIGNMENT_SMS = "JWS: A new task has been assigned to you. Please sign in to view details.";

type StaffRecipient = { id: number; email: string; role: UserRole; employeeProfile: { phone: string } | null };

async function approvedStaff(roles: UserRole[]): Promise<StaffRecipient[]> {
  return prisma.user.findMany({
    where: { role: { in: roles }, status: "APPROVED" },
    select: { id: true, email: true, role: true, employeeProfile: { select: { phone: true } } },
  });
}

async function deliverEmails(recipients: StaffRecipient[], message: Omit<Parameters<typeof sendEmailNotification>[0], "to">) {
  const emails = [...new Set(recipients.map(({ email }) => email.trim().toLowerCase()).filter((email) => emailPattern.test(email)))];
  const results = await Promise.allSettled(emails.map((to) => sendEmailNotification({ to, ...message })));
  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed) console.error(`[email] ${failed} of ${emails.length} notification deliveries failed.`);
}

async function deliverSms(recipients: StaffRecipient[], message: string) {
  const phones = [...new Set(recipients.flatMap(({ employeeProfile }) => employeeProfile?.phone ? [employeeProfile.phone] : []))];
  await Promise.allSettled(phones.map((phone) => sendSmsNotification(phone, message)));
}

export async function notifyAssignedEmployee(taskAssignmentId: number) {
  try {
    const task = await prisma.taskAssignment.findFirst({
      where: { id: taskAssignmentId, isActive: true, employee: { user: { role: "EMPLOYEE", status: "APPROVED" } } },
      select: {
        id: true,
        employee: { select: { phone: true, userId: true, user: { select: { email: true } } } },
        request: { select: { requestCode: true, serviceCategory: true, serviceType: true, area: true, serviceSelections: { select: { serviceLabel: true }, orderBy: { id: "asc" } } } },
      },
    });
    if (!task) return;
    const data = { requestCode: task.request.requestCode, category: task.request.serviceCategory === "JANAZAH" ? "Janazah Services" : task.request.serviceCategory === "VEHICLE" ? "Vehicle Services" : task.request.serviceType, services: task.request.serviceSelections.length ? task.request.serviceSelections.map((item) => item.serviceLabel) : [task.request.serviceType], area: task.request.area };
    const deliveries: Promise<unknown>[] = [
      sendPushToApprovedUser(task.employee.userId, "EMPLOYEE", { title: "JWS New Task Assignment", body: "You have been assigned a new JWS service task. Open JWS to view the details.", url: `/employee/my-tasks/${task.id}`, tag: `task-assignment-${task.id}` }),
      sendSmsNotification(task.employee.phone, ASSIGNMENT_SMS),
    ];
    const appBaseUrl = getEmailAppBaseUrl();
    if (appBaseUrl && emailPattern.test(task.employee.user.email)) deliveries.push(sendEmailNotification({ to: task.employee.user.email, ...taskAssignmentEmail(data, `${appBaseUrl}/employee/my-tasks/${task.id}`) }));
    await Promise.allSettled(deliveries);
  } catch { console.error("[notifications] Task assignment notification could not be completed."); }
}

export async function notifyAdminsOfEmployeeRegistration(data: EmployeeRegistrationNotification) {
  try {
    const admins = await approvedStaff(["ADMIN"]);
    const deliveries: Promise<unknown>[] = [
      sendPushToApprovedUsers(admins.map(({ id }) => id), { title: "New Employee Registration", body: "A new employee registration requires administrator approval.", url: `/admin/employees/${data.employeeId}`, tag: `employee-registration-${data.employeeId}` }),
      deliverSms(admins, STAFF_REGISTRATION_SMS),
    ];
    const appBaseUrl = getEmailAppBaseUrl();
    if (appBaseUrl) deliveries.push(deliverEmails(admins, employeeRegistrationEmail(data, `${appBaseUrl}/admin/employees/${data.employeeId}`)));
    await Promise.allSettled(deliveries);
  } catch { console.error("[notifications] Employee registration notification could not be completed."); }
}

export async function notifyStaffOfNewServiceRequest(data: ServiceRequestNotification, customerMobile: string) {
  try {
    const staff = await approvedStaff(["ADMIN", "SUPERVISOR"]);
    const admins = staff.filter(({ role }) => role === "ADMIN");
    const supervisors = staff.filter(({ role }) => role === "SUPERVISOR");
    const appBaseUrl = getEmailAppBaseUrl();
    const smsAppBaseUrl = getSmsAppBaseUrl();
    const deliveries: Promise<unknown>[] = [
      sendPushToApprovedUsers(admins.map(({ id }) => id), { title: "New JWS Service Request", body: `${data.requestCode} • ${data.category} • New request waiting for assignment.`, url: `/admin/service-requests/${data.requestId}`, tag: `service-request-${data.requestId}` }),
      sendPushToApprovedUsers(supervisors.map(({ id }) => id), { title: "New JWS Service Request", body: `${data.requestCode} • ${data.category} • New request waiting for assignment.`, url: `/supervisor/requests/${data.requestId}`, tag: `service-request-${data.requestId}` }),
      deliverSms(staff, STAFF_REQUEST_SMS),
    ];
    if (appBaseUrl) {
      deliveries.push(deliverEmails(admins, serviceRequestEmail(data, `${appBaseUrl}/admin/service-requests/${data.requestId}`)));
      deliveries.push(deliverEmails(supervisors, serviceRequestEmail(data, `${appBaseUrl}/supervisor/requests/${data.requestId}`)));
    }
    if (smsAppBaseUrl) deliveries.push(sendSmsNotification(customerMobile, `JWS: Your service request has been received. Tracking Code: ${data.requestCode}. Track: ${smsAppBaseUrl}/track-request`));
    await Promise.allSettled(deliveries);
  } catch { console.error("[notifications] Service request notification could not be completed."); }
}
