import { cookies } from "next/headers";
import { auth } from "@/auth";
import { PreviewNavigation } from "@/app/design-preview/emerald-sanctuary/preview-navigation";
import styles from "@/app/design-preview/emerald-sanctuary/sanctuary.module.css";

export async function PublicSiteHeader() {
  const [cookieStore, session] = await Promise.all([cookies(), auth()]);
  const locale = cookieStore.get("jws-language")?.value === "ta" ? "ta" : "en";
  const role = session?.user.status === "APPROVED" ? session.user.role : null;
  return <div className={`${styles.navigationTheme} jws-public-theme`}>
    <PreviewNavigation locale={locale} role={role} homeHref="/" solid />
  </div>;
}
