import type { Metadata } from "next";
import "./globals.css";
import "./jws-theme.css";
import { cookies } from "next/headers";
import { jwsFontVariables } from "@/lib/jws-fonts";
import { PublicLanguage } from "@/components/public-language";

export const metadata: Metadata = {
  title: {
    default: "Janaza Care",
    template: "%s | Janaza Care",
  },
  description:
    "Compassionate guidance and practical support for Muslim families.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = (await cookies()).get("jws-language")?.value === "ta" ? "ta" : "en";
  return (
    <html lang={locale} className={`h-full antialiased ${jwsFontVariables}`}>
      <body className="min-h-full"><PublicLanguage locale={locale} wrap={false}>{children}</PublicLanguage></body>
    </html>
  );
}
