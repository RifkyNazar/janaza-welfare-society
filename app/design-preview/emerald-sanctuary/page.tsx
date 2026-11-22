import type { Metadata } from "next";
import { EmeraldSanctuary } from "@/components/emerald-sanctuary";

export const metadata: Metadata = { title: "Emerald Sanctuary | JWS Homepage Preview", description: "An isolated homepage preview for Janaza Welfare Society, Kattankudy.", robots: { index: false, follow: false } };

export default function EmeraldSanctuaryPreview() {
  return <EmeraldSanctuary preview />;
}
