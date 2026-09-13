"use client";

import { useEffect, useRef, useState } from "react";

export function CopyTextButton({ value, label, copiedLabel = "Copied!", className = "" }: { value: string; label: string; copiedLabel?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function copy() { try { await navigator.clipboard.writeText(value); setCopied(true); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); } }
  return <button type="button" onClick={copy} className={className || "min-h-11 rounded-full border border-primary bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-light-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"} aria-live="polite">{copied ? copiedLabel : label}</button>;
}
