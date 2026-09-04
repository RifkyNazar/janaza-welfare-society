"use client";

export function DownloadRequestPdf({ requestCode, pdfBase64 }: { requestCode: string; pdfBase64?: string }) {
  function download() {
    if (!pdfBase64) return;
    const bytes = Uint8Array.from(atob(pdfBase64), (character) => character.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `JWS-Request-${requestCode.replace(/[^A-Za-z0-9-]/g, "-")}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" onClick={download} disabled={!pdfBase64} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary bg-white px-6 py-3 font-semibold text-foreground transition-colors hover:bg-light-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4"><path d="M10 3v9m-4-4 4 4 4-4M4 16h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Download PDF
    </button>
  );
}
