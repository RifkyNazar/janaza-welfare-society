"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { LanguageSelector } from "@/components/public-language";
import type { Locale } from "@/lib/i18n";
import { previewCopy } from "./preview-copy";
import styles from "./sanctuary.module.css";

export function PreviewNavigation({ locale, role, homeHref = "/design-preview/emerald-sanctuary", solid = false }: { locale: Locale; role: string | null; homeHref?: string; solid?: boolean }) {
  const t = previewCopy(locale);
  const drawer = useRef<HTMLDialogElement>(null);
  const staff = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !staff.current?.contains(event.target)) staff.current?.removeAttribute("open");
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && staff.current?.open) {
        staff.current.open = false;
        staff.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const publicLinks = [{ href: "/", label: t.home }, { href: "/services", label: t.services }, { href: "/team", label: t.team }, { href: "/operations", label: t.activities }, { href: "/contact", label: t.contact }];
  const staffLinks = [{ href: role === "EMPLOYEE" ? "/employee" : "/employee-access/login", label: role === "EMPLOYEE" ? t.employeePortal : t.employeeLogin }, { href: role === "ADMIN" ? "/admin" : "/admin/login", label: role === "ADMIN" ? t.adminDashboard : t.adminLogin }, { href: "/supervisor", label: t.supervisor }];
  return <header className={`${styles.header} ${solid ? styles.solidHeader : ""}`} lang={locale}>
    <Link className={styles.brand} href={homeHref} aria-label={t.brand}><span className={styles.logo}><Image src="/images/jws/logo.png" alt="JWS" width={54} height={54} /></span><span className={styles.brandCopy}>{t.brand}<small>{t.town}</small></span><span className={styles.compactBrand} aria-hidden="true">JWS</span></Link>
    <nav className={styles.desktopNav} aria-label={t.navigation}>{publicLinks.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
    <div className={styles.navTools}>
      <div className={styles.desktopLanguage}><LanguageSelector /></div>
      <div className={styles.mobileLanguage}><LanguageSelector /></div>
      <details ref={staff} className={styles.staffMenu} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}><summary><span>{t.staff}</span><svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg></summary><div>{staffLinks.map(link => <Link key={link.href} href={link.href} onClick={() => { if (staff.current) staff.current.open = false; }}>{link.label}</Link>)}</div></details>
      <button className={styles.drawerTrigger} type="button" aria-haspopup="dialog" aria-label={t.menu} onClick={() => drawer.current?.showModal()}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="1.5" /></svg></button>
    </div>
    <dialog ref={drawer} className={styles.navigationDrawer} aria-label={t.navigation} onClick={event => { if (event.target === event.currentTarget) drawer.current?.close(); }}>
      <div className={styles.drawerInner}><div className={styles.drawerHeading}><span>{t.brand}</span><button type="button" aria-label={t.close} onClick={() => drawer.current?.close()}>×</button></div><nav aria-label={t.navigation}>{publicLinks.map(link => <Link href={link.href} key={link.href} onClick={() => drawer.current?.close()}>{link.label}<span aria-hidden="true">↗</span></Link>)}</nav><div className={styles.drawerLanguage}><span>{t.language}</span><LanguageSelector /></div><p className={styles.drawerGroupLabel}>{t.staff}</p><nav aria-label={t.staff}>{staffLinks.map(link => <Link key={link.href} href={link.href} onClick={() => drawer.current?.close()}>{link.label}<span aria-hidden="true">↗</span></Link>)}</nav><Link className={styles.primary} href="/request-service" onClick={() => drawer.current?.close()}>{t.request}</Link></div>
    </dialog>
    <noscript><nav className={styles.noScriptNav} aria-label={t.navigation}>{[...publicLinks, ...staffLinks].map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav></noscript>
  </header>;
}
