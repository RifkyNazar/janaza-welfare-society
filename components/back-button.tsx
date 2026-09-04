"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref: string;
  label?: string;
  className?: string;
};

export function BackButton({ fallbackHref, label = "Back", className = "" }: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/50 bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 10H4m5-5-5 5 5 5" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
