import { Footer } from "@/components/footer";
import { PublicSiteHeader } from "@/components/public-site-header";
import { cookies } from "next/headers";
import { PublicLanguage } from "@/components/public-language";
import { PublicShell } from "@/components/public-shell";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const locale = (await cookies()).get("jws-language")?.value === "ta" ? "ta" : "en";
  return (
    <PublicLanguage locale={locale}><PublicShell header={<PublicSiteHeader />} footer={<Footer />}>
      {children}
    </PublicShell></PublicLanguage>
  );
}
