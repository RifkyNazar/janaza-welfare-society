import "server-only";

import { prisma } from "@/lib/prisma";
import { getEmailAppBaseUrl, sendEmailNotification } from "@/lib/notifications/email";
import { employeeRegistrationEmail, serviceRequestEmail } from "@/lib/notifications/templates";
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
      where: { role: { in: ["ADMIN", "EMPLOYEE"] }, status: "APPROVED", email: { not: "" } },
      select: { email: true, role: true },
    });
    const recipients = new Map<string, "ADMIN" | "EMPLOYEE">();
    for (const user of users) {
      const email = user.email.trim().toLowerCase();
      if (emailPattern.test(email) && !recipients.has(email)) recipients.set(email, user.role);
    }
    const deliveries = [...recipients].map(([to, role]) => {
      const path = role === "ADMIN" ? `/admin/service-requests/${data.requestId}` : `/employee/tasks/${data.requestId}`;
      return sendEmailNotification({ to, ...serviceRequestEmail(data, `${appBaseUrl}${path}`) });
    });
    const results = await Promise.allSettled(deliveries);
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed > 0) console.error(`[email] ${failed} of ${deliveries.length} service request notification deliveries failed.`);
  } catch {
    console.error("[email] Service request notification could not be completed.");
  }
}
