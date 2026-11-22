"use client";

import { useTranslation } from "@/components/public-language";

export function PortalDate({ value }: { value: string }) {
  const { locale } = useTranslation();
  const formatter = new Intl.DateTimeFormat(locale === "ta" ? "ta-LK" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Colombo",
  });
  return <time dateTime={value}>{formatter.format(new Date(value))}</time>;
}
