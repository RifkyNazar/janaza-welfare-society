"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { T, useTranslation } from "@/components/public-language";

type Item = readonly [label: string, href: string];
type Group = readonly [label: string, items: readonly Item[]];

export function PortalNavigation({ label, items = [], groups = [] }: {
  label: string;
  items?: readonly Item[];
  groups?: readonly Group[];
}) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<{ path: string; groups: Record<string, boolean> }>();
  const isActive = (href: string) => pathname === href || (href.split("/").length > 2 && pathname.startsWith(`${href}/`));

  function closeMobileMenu(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.currentTarget.closest<HTMLDetailsElement>(".portal-mobile-menu")?.removeAttribute("open");
  }

  const renderLinks = (links: readonly Item[]) => links.map(([text, href]) => (
    <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} onClick={closeMobileMenu}>
      <T text={text} />
    </Link>
  ));

  return (
    <nav aria-label={t(label)} className="portal-nav">
      {renderLinks(items)}
      {groups.map(([group, links]) => {
        const choices = expanded?.path === pathname ? expanded.groups : {};
        const open = choices[group] ?? links.some(([, href]) => isActive(href));
        return (
          <details key={group} open={open}>
            <summary onClick={(event) => {
              event.preventDefault();
              setExpanded({ path: pathname, groups: { ...choices, [group]: !open } });
            }}><T text={group} /></summary>
            <div>{renderLinks(links)}</div>
          </details>
        );
      })}
    </nav>
  );
}
