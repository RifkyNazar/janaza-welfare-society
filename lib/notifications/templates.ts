import type { EmployeeRegistrationNotification, ServiceRequestNotification } from "@/lib/notifications/types";

const colors = { primary: "#45E8CD", light: "#A8F5E8", dark: "#102A2A", muted: "#5F6F6D" };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
    timeZoneName: "short",
  }).format(value);
}

function layout(title: string, rows: Array<[string, string]>, buttonLabel: string, dashboardUrl: string) {
  const tableRows = rows.map(([label, value]) => `<tr><th style="padding:10px 12px;text-align:left;vertical-align:top;color:${colors.muted};font-size:13px;border-bottom:1px solid #e5eceb;width:34%">${escapeHtml(label)}</th><td style="padding:10px 12px;color:${colors.dark};font-size:14px;border-bottom:1px solid #e5eceb">${escapeHtml(value)}</td></tr>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#f5f8f7;font-family:Arial,sans-serif;color:${colors.dark}"><div style="max-width:620px;margin:0 auto;padding:28px 16px"><div style="background:#fff;border:1px solid #dce7e5;border-radius:12px;overflow:hidden"><div style="padding:20px 24px;background:${colors.light}"><div style="font-size:14px;font-weight:700;letter-spacing:.04em">Janaza Welfare Society</div><h1 style="margin:8px 0 0;font-size:23px;line-height:1.25">${escapeHtml(title)}</h1></div><div style="padding:24px"><table role="presentation" style="width:100%;border-collapse:collapse">${tableRows}</table><div style="margin-top:24px"><a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:${colors.primary};color:${colors.dark};font-weight:700;text-decoration:none">${escapeHtml(buttonLabel)}</a></div><p style="margin:24px 0 0;color:${colors.muted};font-size:12px;line-height:1.5">The dashboard remains the source of full details.</p></div></div><p style="margin:16px 8px;color:${colors.muted};font-size:11px;text-align:center">This is an automated operational notification from Janaza Welfare Society.</p></div></body></html>`;
}

function plainText(title: string, rows: Array<[string, string]>, buttonLabel: string, dashboardUrl: string) {
  return ["Janaza Welfare Society", "", title, "", ...rows.map(([label, value]) => `${label}: ${value}`), "", `${buttonLabel}: ${dashboardUrl}`, "", "The dashboard remains the source of full details.", "This is an automated operational notification from Janaza Welfare Society."].join("\n");
}

export function employeeRegistrationEmail(data: EmployeeRegistrationNotification, dashboardUrl: string) {
  const rows: Array<[string, string]> = [
    ["Employee Name", data.fullName],
    ["Employee Email", data.email],
    ...(data.employeeCode ? [["Employee Code", data.employeeCode] as [string, string]] : []),
    ["Registration Date/Time", formatDate(data.registeredAt)],
    ["Status", "Pending Approval"],
  ];
  const title = "New Employee Registration - Approval Required";
  return { subject: title, html: layout(title, rows, "Open Admin Dashboard", dashboardUrl), text: plainText(title, rows, "Open Admin Dashboard", dashboardUrl) };
}

export function serviceRequestEmail(data: ServiceRequestNotification, dashboardUrl: string) {
  const rows: Array<[string, string]> = [
    ["Request Code", data.requestCode],
    ["Category", data.category],
    ["Services", data.services.join(", ")],
    ["Area / Location", data.area],
    ["Submitted Date/Time", formatDate(data.submittedAt)],
  ];
  const title = `New JWS Service Request - ${data.requestCode}`;
  return { subject: title, html: layout(title, rows, "Open JWS Dashboard", dashboardUrl), text: plainText(title, rows, "Open JWS Dashboard", dashboardUrl) };
}
