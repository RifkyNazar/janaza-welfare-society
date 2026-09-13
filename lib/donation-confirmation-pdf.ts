import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export type DonationConfirmationData = { referenceCode: string; fullName: string; mobileNumber: string; amount: string; transferDate: Date; bankReference: string | null; createdAt: Date };
const dark = rgb(0.063, 0.165, 0.165), muted = rgb(0.373, 0.435, 0.427), mint = rgb(0.271, 0.91, 0.804), soft = rgb(0.957, 1, 0.988), border = rgb(0.867, 0.961, 0.941);

function safe(value: string, font: PDFFont) { return [...value].map((character) => { try { font.encodeText(character); return character; } catch { return "?"; } }).join(""); }
function wrap(value: string, font: PDFFont, size: number, width: number) { const lines: string[] = []; let line = ""; for (const word of safe(value, font).split(/\s+/)) { const candidate = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate; else { if (line) lines.push(line); line = word; } } if (line) lines.push(line); return lines; }

export async function createDonationConfirmationPdf(data: DonationConfirmationData) {
  const document = await PDFDocument.create();
  document.setTitle("JWS Donation Transfer Confirmation");
  document.setAuthor("Janaza Welfare Society (JWS)");
  const regular = await document.embedFont(StandardFonts.Helvetica), bold = await document.embedFont(StandardFonts.HelveticaBold);
  const page = document.addPage([595.28, 841.89]); let y = 790;
  page.drawRectangle({ x: 0, y: 833.89, width: 595.28, height: 8, color: mint });
  const text = (value: string, x: number, size: number, font = regular, color = dark) => page.drawText(safe(value, font), { x, y, size, font, color });
  const row = (label: string, value?: string | null) => { if (!value) return; text(label.toUpperCase(), 48, 8, bold, muted); page.drawText(safe(value, regular), { x: 190, y, size: 10.5, font: regular, color: dark }); y -= 30; };
  text("JANAZA WELFARE SOCIETY (JWS)", 48, 16, bold); y -= 22; text("Kattankudy, Sri Lanka", 48, 10, regular, muted); y -= 48;
  text("DONATION TRANSFER CONFIRMATION", 48, 19, bold); y -= 42;
  page.drawRectangle({ x: 48, y: y - 62, width: 499.28, height: 78, color: soft, borderColor: mint, borderWidth: 1 });
  page.drawText("REFERENCE", { x: 66, y: y - 8, size: 8, font: bold, color: muted }); page.drawText(safe(data.referenceCode, bold), { x: 66, y: y - 35, size: 18, font: bold, color: dark }); y -= 94;
  row("Donor Name", data.fullName); row("Mobile", data.mobileNumber); row("Donation Amount", `LKR ${data.amount}`); row("Transfer Date", new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(data.transferDate)); row("Bank Reference", data.bankReference); row("Submission Status", "PENDING VERIFICATION"); row("Submitted Date", new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Colombo" }).format(data.createdAt));
  y -= 10; page.drawLine({ start: { x: 48, y }, end: { x: 547.28, y }, thickness: 1, color: border }); y -= 34;
  for (const line of wrap("This document confirms that Janaza Welfare Society received your transfer confirmation submission. It does not by itself confirm that the bank transfer has been verified.", regular, 10, 499.28)) { text(line, 48, 10); y -= 16; }
  y -= 12; text("Please keep your donation reference code safely.", 48, 10, bold);
  page.drawLine({ start: { x: 48, y: 38 }, end: { x: 547.28, y: 38 }, thickness: 1, color: border }); page.drawText("JWS | Private Donation Transfer Confirmation", { x: 48, y: 23, size: 7.5, font: regular, color: muted });
  return document.save();
}
