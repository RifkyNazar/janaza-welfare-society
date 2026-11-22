"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// The homepage supplies its own approved header, main landmark and footer.
export function PublicShell({ children, header, footer }: { children: ReactNode; header: ReactNode; footer: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;
  return <div className="jws-public flex min-h-screen flex-col">
    {header}
    <main className="flex-1">{children}</main>
    {footer}
  </div>;
}
