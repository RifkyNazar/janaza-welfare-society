import { cookies } from "next/headers";
import { translate } from "@/lib/i18n";

export async function getPortalTranslation() {
  const locale = (await cookies()).get("jws-language")?.value === "ta" ? "ta" : "en";
  return {
    t: (text: string) => translate(locale, text),
    dateLocale: locale === "ta" ? "ta-LK" : "en-GB",
  };
}
