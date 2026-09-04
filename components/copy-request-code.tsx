"use client";

import { useEffect, useRef, useState } from "react";

export function CopyRequestCode({ requestCode }: { requestCode: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(requestCode);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return <button type="button" onClick={copy} className="min-h-12 rounded-full border border-primary bg-white px-6 py-3 font-semibold text-foreground transition hover:bg-light-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-live="polite">{copied ? "Copied!" : "Copy Request Code"}</button>;
}
