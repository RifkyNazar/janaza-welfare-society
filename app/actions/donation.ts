"use server";

import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createDonationConfirmationPdf } from "@/lib/donation-confirmation-pdf";
import { removeDonationReceipt, safeReceiptFileName, storeDonationReceipt, validateDonationReceipt } from "@/lib/donation-receipt-storage";

export type DonationActionState = { error?: string; referenceCode?: string; pdfBase64?: string };
const limits = { fullName: 150, mobileNumber: 30, bankReference: 150, note: 2000 } as const;
function text(formData: FormData, name: string) { const entry = formData.get(name); return typeof entry === "string" ? entry.trim() : ""; }
function referenceCode() { return `JWS-DON-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`; }

export async function submitDonationConfirmation(_state: DonationActionState, formData: FormData): Promise<DonationActionState> {
  void _state;
  const fullName = text(formData, "fullName"), mobileNumber = text(formData, "mobileNumber"), amountInput = text(formData, "amount"), transferDateInput = text(formData, "transferDate"), bankReference = text(formData, "bankReference"), note = text(formData, "note");
  const receiptEntry = formData.get("receipt");
  if (!fullName || !mobileNumber || !amountInput || !transferDateInput) return { error: "Please complete all required fields." };
  if (fullName.length > limits.fullName || mobileNumber.length > limits.mobileNumber || bankReference.length > limits.bankReference || note.length > limits.note) return { error: "One or more fields exceed the allowed length." };
  if (!/^[+]?[0-9][0-9\s-]{7,20}$/.test(mobileNumber)) return { error: "Please enter a valid mobile number." };
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(amountInput)) return { error: "Please enter a valid positive donation amount with no more than two decimal places." };
  const amount = Number(amountInput);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 9_999_999_999.99) return { error: "Please enter a donation amount between LKR 0.01 and LKR 9,999,999,999.99." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transferDateInput)) return { error: "Please enter a valid transfer date." };
  const transferDate = new Date(`${transferDateInput}T00:00:00.000Z`);
  if (Number.isNaN(transferDate.getTime()) || transferDate.toISOString().slice(0, 10) !== transferDateInput || transferDateInput > new Date().toISOString().slice(0, 10)) return { error: "Transfer date must be a valid date that is not in the future." };
  if (!(receiptEntry instanceof File)) return { error: "Please attach the transfer receipt or proof." };
  const receiptError = validateDonationReceipt(receiptEntry);
  if (receiptError) return { error: receiptError };

  let stored: Awaited<ReturnType<typeof storeDonationReceipt>> | null = null;
  try {
    stored = await storeDonationReceipt(receiptEntry);
    const receiptFileName = safeReceiptFileName(receiptEntry.name, stored.mimeType);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const code = referenceCode();
      try {
        const donation = await prisma.donation.create({ data: { referenceCode: code, fullName, mobileNumber, amount: amountInput, transferDate, bankReference: bankReference || null, note: note || null, receiptFileName, receiptStorageKey: stored.storageKey, receiptMimeType: stored.mimeType, status: "PENDING" } });
        try { const pdf = await createDonationConfirmationPdf({ referenceCode: code, fullName, mobileNumber, amount: donation.amount.toFixed(2), transferDate, bankReference: bankReference || null, createdAt: donation.createdAt }); return { referenceCode: code, pdfBase64: Buffer.from(pdf).toString("base64") }; }
        catch (pdfError) { console.error("Unable to generate donation confirmation PDF", pdfError); return { referenceCode: code }; }
      } catch (error) {
        const collision = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && String(error.meta?.target ?? "").includes("referenceCode");
        if (!collision) throw error;
      }
    }
    throw new Error("REFERENCE_CODE_COLLISION");
  } catch (error) {
    if (stored) await removeDonationReceipt(stored.storageKey);
    if (error instanceof Error && error.message === "INVALID_RECEIPT_SIGNATURE") return { error: "The receipt contents do not match its declared file type." };
    console.error("Unable to save donation confirmation", error);
    return { error: "Unable to submit the transfer confirmation. Please try again." };
  }
}
