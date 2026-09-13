"use client";

export function DownloadDonationPdf({ referenceCode, pdfBase64 }: { referenceCode: string; pdfBase64?: string }) {
  function download() { if (!pdfBase64) return; const bytes = Uint8Array.from(atob(pdfBase64), (character) => character.charCodeAt(0)); const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `JWS-Donation-${referenceCode.replace(/[^A-Za-z0-9-]/g, "-")}.pdf`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); }
  return <button type="button" onClick={download} disabled={!pdfBase64} className="min-h-12 rounded-full border border-primary bg-white px-6 py-3 font-semibold disabled:opacity-50">Download Confirmation PDF</button>;
}
