import type { ReactNode } from "react";

export function StatusMessage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div role="status" aria-live="polite" tabIndex={-1} className={`rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground ${className}`}>{children}</div>;
}
