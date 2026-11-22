import { T } from "@/components/public-language";
import Image from "next/image";
import Link from "next/link";

export function PortalBrand({ title }: { title: string }) {
  return <div className="jws-portal-brand">
    <Link href="/" className="flex min-w-0 items-center gap-3 break-words">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white p-1"><Image src="/images/jws/logo.png" alt="JWS" width={40} height={40} /></span>
      <span className="text-sm font-semibold leading-6"><T text="Janaza Welfare Society" /><small className="block font-normal opacity-80"><T text="Kattankudy" /></small></span>
    </Link>
    <p className="mt-6 text-xl font-semibold"><T text={title} /></p>
  </div>;
}
