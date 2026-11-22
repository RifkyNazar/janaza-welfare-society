"use client";
import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { translate, type Locale } from "@/lib/i18n";
const LanguageContext = createContext<Locale>("en");
export function PublicLanguage({ locale, children, wrap = true }: { locale: Locale; children: React.ReactNode; wrap?: boolean }) {
  return <LanguageContext.Provider value={locale}>{wrap ? <div lang={locale}>{children}</div> : children}</LanguageContext.Provider>;
}
export function useTranslation() { const locale = useContext(LanguageContext); return { locale, t: (text: string) => translate(locale, text) }; }
export function T({ text }: { text: string }) { const { t } = useTranslation(); return <>{t(text)}</>; }
export function LanguageSelector() {
  const { locale } = useTranslation(); const router = useRouter();
  return <label className="inline-flex items-center text-sm"><span className="sr-only">தமிழ் / English</span><select aria-label="தமிழ் / English" value={locale} className="min-h-11 rounded-lg border border-border bg-white px-2 text-foreground" onChange={e => {
    const next = e.target.value === "ta" ? "ta" : "en";
    document.cookie = `jws-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    router.refresh();
  }}><option value="ta">தமிழ்</option><option value="en">English</option></select></label>;
}
