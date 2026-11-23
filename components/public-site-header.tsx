import { cookies } from "next/headers";
import { currentStaffRole } from "@/lib/permissions";
import { PreviewNavigation } from "@/app/design-preview/emerald-sanctuary/preview-navigation";
import styles from "@/app/design-preview/emerald-sanctuary/sanctuary.module.css";

export async function PublicSiteHeader() {
  const [cookieStore, role] = await Promise.all([cookies(), currentStaffRole()]);
  const locale = cookieStore.get("jws-language")?.value === "ta" ? "ta" : "en";
  return <div className={`${styles.navigationTheme} jws-public-theme`}>
    <PreviewNavigation locale={locale} role={role} homeHref="/" solid />
  </div>;
}
