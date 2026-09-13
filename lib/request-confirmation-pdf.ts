import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type RequestConfirmationData = {
  requestCode: string;
  requesterName: string;
  mobileNumber: string;
  alternativeNumber: string | null;
  relationshipToDeceased: string | null;
  serviceType: string;
  preferredVehicle: { name: string; vehicleNumber: string; vehicleType: string } | null;
  requiredDate: Date;
  requiredTime: string | null;
  placeType: string;
  address: string;
  area: string;
  hospitalName: string | null;
  locationLink: string | null;
  note: string | null;
  status: string;
  createdAt: Date;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const dark = rgb(0.063, 0.165, 0.165);
const muted = rgb(0.373, 0.435, 0.427);
const mint = rgb(0.271, 0.91, 0.804);
const softMint = rgb(0.957, 1, 0.988);
const border = rgb(0.867, 0.961, 0.941);

function pdfSafe(value: string, font: PDFFont) {
  return [...value].map((character) => {
    try { font.encodeText(character); return character; } catch { return "?"; }
  }).join("");
}

function wrapText(value: string, font: PDFFont, size: number, maxWidth: number) {
  const paragraphs = pdfSafe(value, font).split(/\r?\n/);
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) { lines.push(""); continue; }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
      else {
        if (line) lines.push(line);
        let remainder = word;
        while (font.widthOfTextAtSize(remainder, size) > maxWidth && remainder.length > 1) {
          let cut = remainder.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(remainder.slice(0, cut), size) > maxWidth) cut -= 1;
          lines.push(remainder.slice(0, cut));
          remainder = remainder.slice(cut);
        }
        line = remainder;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

export async function createRequestConfirmationPdf(data: RequestConfirmationData) {
  const document = await PDFDocument.create();
  document.setTitle("Janaza Service Request Confirmation");
  document.setAuthor("Janaza Welfare Society (JWS)");
  document.setSubject(`Private confirmation for ${data.requestCode}`);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  let page: PDFPage = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 8, width: PAGE_WIDTH, height: 8, color: mint });

  const addPage = () => {
    page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 8, width: PAGE_WIDTH, height: 8, color: mint });
  };
  const ensure = (height: number) => { if (y - height < 55) addPage(); };
  const text = (value: string, x: number, size: number, font = regular, color = dark) => page.drawText(pdfSafe(value, font), { x, y, size, font, color });
  const section = (title: string) => {
    ensure(42);
    y -= 14;
    page.drawLine({ start: { x: MARGIN, y: y + 10 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 10 }, thickness: 1, color: border });
    text(title, MARGIN, 10, bold, dark);
    y -= 24;
  };
  const row = (label: string, value: string | null) => {
    if (!value) return;
    const labelWidth = 142;
    const lines = wrapText(value, regular, 10, CONTENT_WIDTH - labelWidth);
    const height = Math.max(18, lines.length * 14) + 8;
    ensure(height);
    text(label.toUpperCase(), MARGIN, 7.5, bold, muted);
    lines.forEach((line, index) => page.drawText(line, { x: MARGIN + labelWidth, y: y - index * 14, size: 10, font: regular, color: dark }));
    y -= height;
  };

  text("JANAZA WELFARE SOCIETY (JWS)", MARGIN, 16, bold);
  y -= 20;
  text("Kattankudy, Sri Lanka", MARGIN, 10, regular, muted);
  y -= 38;
  text("JANAZA SERVICE REQUEST CONFIRMATION", MARGIN, 19, bold);
  y -= 27;
  page.drawRectangle({ x: MARGIN, y: y - 15, width: CONTENT_WIDTH, height: 28, color: dark });
  page.drawText("PRIVATE REQUEST CONFIRMATION", { x: MARGIN + 12, y: y - 5, size: 9, font: bold, color: mint });
  y -= 54;
  page.drawRectangle({ x: MARGIN, y: y - 70, width: CONTENT_WIDTH, height: 84, color: softMint, borderColor: mint, borderWidth: 1 });
  page.drawText("REQUEST CODE", { x: MARGIN + 18, y: y - 10, size: 8, font: bold, color: muted });
  page.drawText(pdfSafe(data.requestCode, bold), { x: MARGIN + 18, y: y - 34, size: 20, font: bold, color: dark });
  page.drawText("KEEP THIS CODE SAFE", { x: MARGIN + 18, y: y - 57, size: 9, font: bold, color: dark });
  y -= 92;

  section("REQUESTER DETAILS");
  row("Requester Name", data.requesterName);
  row("Mobile Number", data.mobileNumber);
  row("Alternative Number", data.alternativeNumber);
  row("Relationship", data.relationshipToDeceased);
  section("SERVICE DETAILS");
  row("Service Type", data.serviceType);
  row("Preferred Vehicle", data.preferredVehicle ? `${data.preferredVehicle.name} / ${data.preferredVehicle.vehicleNumber} / ${data.preferredVehicle.vehicleType}` : "No Preference");
  row("Required Date", new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(data.requiredDate));
  row("Required Time", data.requiredTime);
  row("Place Type", data.placeType.replaceAll("_", " "));
  section("LOCATION DETAILS");
  row("Full Address", data.address);
  row("Area", data.area);
  row("Hospital Name", data.hospitalName);
  row("Location Link", data.locationLink);
  if (data.note) { section("ADDITIONAL INFORMATION"); row("Notes", data.note); }
  section("REQUEST STATUS");
  row("Current Status", data.status === "NEW" ? "Request Received" : data.status.replaceAll("_", " "));
  row("Submitted Date", new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Colombo" }).format(data.createdAt));
  section("TRACKING");
  for (const line of wrapText("Use this request code together with your registered mobile number to track your request.", regular, 10, CONTENT_WIDTH)) { ensure(15); text(line, MARGIN, 10); y -= 15; }
  y -= 8;
  for (const line of wrapText("This document contains personal request information. Please keep it private.", bold, 9, CONTENT_WIDTH)) { ensure(14); text(line, MARGIN, 9, bold, muted); y -= 14; }

  const pages = document.getPages();
  pages.forEach((currentPage, index) => {
    currentPage.drawLine({ start: { x: MARGIN, y: 38 }, end: { x: PAGE_WIDTH - MARGIN, y: 38 }, thickness: 1, color: border });
    currentPage.drawText(`JWS | Private Request Confirmation | Page ${index + 1} of ${pages.length}`, { x: MARGIN, y: 23, size: 7.5, font: regular, color: muted });
  });
  return document.save();
}
