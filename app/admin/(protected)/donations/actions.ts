"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export type DonationReviewState = { error?: string; success?: string; reviewNote?: string };

export async function reviewDonation(donationId: number, decision: string, _state: DonationReviewState, formData: FormData): Promise<DonationReviewState> {
  void _state;
  const session = await requireAdmin();
  if (!Number.isSafeInteger(donationId) || donationId <= 0) return { error: "Invalid donation." };
  if (decision !== "VERIFIED" && decision !== "REJECTED") return { error: "Invalid review action." };
  const reviewerId = Number(session.user.id);
  if (!Number.isSafeInteger(reviewerId) || reviewerId <= 0) return { error: "Unable to identify the reviewing administrator." };
  const entry = formData.get("reviewNote");
  const reviewNote = typeof entry === "string" ? entry.trim() : "";
  if (reviewNote.length > 191) return { error: "Review note must be 191 characters or fewer.", reviewNote };
  const result = await prisma.donation.updateMany({ where: { id: donationId, status: "PENDING" }, data: { status: decision, reviewedAt: new Date(), reviewedByUserId: reviewerId, reviewNote: reviewNote || null } });
  if (result.count !== 1) return { error: "This donation is no longer pending or was reviewed by another administrator.", reviewNote };
  revalidatePath("/admin/donations");
  revalidatePath(`/admin/donations/${donationId}`);
  return { success: decision === "VERIFIED" ? "Donation marked as verified." : "Donation confirmation rejected." };
}
