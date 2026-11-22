import type { ReactNode } from "react";
import { LanguageSelector, T } from "@/components/public-language";
import { PortalBrand } from "@/components/portal-brand";
import { PortalValidation } from "@/components/portal-validation";

export function PortalShell({ title, heading, identity, logout, navigation, children }: {
  title: string;
  heading: string;
  identity?: string | null;
  logout: () => Promise<void>;
  navigation: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="jws-portal jws-portal-shell">
      <aside className="portal-sidebar">
        <PortalBrand title={title} />
        {navigation}
      </aside>
      <div className="portal-workspace">
        <header className="portal-header">
          <div className="portal-header-row">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary"><T text={heading} /></p>
              {identity && <p className="text-sm text-muted">{identity}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LanguageSelector />
              <form action={logout}>
                <button type="submit" className="jws-button jws-button-outline portal-logout"><T text="Logout" /></button>
              </form>
            </div>
          </div>
          <details className="portal-mobile-menu">
            <summary><T text="Navigation" /></summary>
            {navigation}
          </details>
        </header>
        <main className="portal-main"><PortalValidation>{children}</PortalValidation></main>
      </div>
    </div>
  );
}
