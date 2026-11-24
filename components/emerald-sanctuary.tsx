import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { currentStaffRole } from "@/lib/permissions";
import { PublicLanguage } from "@/components/public-language";
import { leadershipTeam } from "@/lib/leadership-team";
import { LoopingCardRail } from "@/components/looping-card-rail";
import { LatestActivities } from "@/app/design-preview/emerald-sanctuary/latest-activities";
import { PreviewMotion } from "@/app/design-preview/emerald-sanctuary/preview-motion";
import { PreviewNavigation } from "@/app/design-preview/emerald-sanctuary/preview-navigation";
import { QuranIntro } from "@/app/design-preview/emerald-sanctuary/quran-intro";
import { ArrowIcon as Arrow, PhoneIcon } from "@/app/design-preview/emerald-sanctuary/preview-icon";
import { previewCopy, quranSource, quranTranslation, quranVerse } from "@/app/design-preview/emerald-sanctuary/preview-copy";
import styles from "@/app/design-preview/emerald-sanctuary/sanctuary.module.css";



export async function EmeraldSanctuary({ preview = false, announcements, heroMedia, operationalMembers = [] }: {
  preview?: boolean;
  announcements?: ReactNode;
  heroMedia?: ReactNode;
  operationalMembers?: { id: number; fullName: string; version: number }[];
}) {
  const [cookieStore, role] = await Promise.all([cookies(), currentStaffRole()]);
  const locale = cookieStore.get("jws-language")?.value === "ta" ? "ta" : "en";
  const t = previewCopy(locale);
  const services = [
    { id: "janaza", title: t.janaza, description: t.janazaText, action: t.request, href: "/request-service", className: styles.featuredService },
    { id: "transport", title: t.transport, description: t.transportText, action: t.request, href: "/request-service", className: styles.transportService },
    { id: "community", title: t.people, description: t.peopleText, action: t.meet, href: "/team", className: styles.communityService },
  ];
  const roles: Record<string, string> = { President: t.president, Secretary: t.secretary, Treasurer: t.treasurer };
  const teamCards = (repeat = false) => [
    ...leadershipTeam.map(member => <article className={styles.profileCard} key={member.position}>
      <div className={styles.profilePortrait}><div className={styles.profileHalo} aria-hidden="true" />{member.photoSrc && <Image src={member.photoSrc} alt="" fill loading="lazy" sizes="(min-width: 900px) 35vw, 72vw" />}</div>
      <div className={styles.profileInfo}><span className={styles.profileRole}>{roles[member.position] ?? member.position}</span><h3 lang="en"><Link href={`/team#leader-${member.position.toLowerCase()}`} tabIndex={repeat ? -1 : undefined}>{member.name}</Link></h3><a className={styles.profileContact} href={`tel:${member.contact}`} tabIndex={repeat ? -1 : undefined} aria-label={`${t.call} ${member.name}: ${member.contact}`}><bdi dir="ltr">{member.contact}</bdi><span className={styles.profileCallIcon}><PhoneIcon /></span></a></div>
    </article>),
    ...operationalMembers.map(member => <article className={styles.profileCard} key={member.id}>
      <div className={styles.profilePortrait}><Image unoptimized src={`/team-member-photos/${member.id}?v=${member.version}`} alt="" fill loading="lazy" sizes="(min-width: 900px) 35vw, 72vw" /></div>
      <div className={styles.profileInfo}><span className={styles.profileRole}>{t.operationalTeam}</span><h3>{member.fullName}</h3></div>
    </article>),
  ];
  return <PublicLanguage locale={locale}><div id={preview ? "emerald-preview" : "emerald-home"} className={`${styles.sanctuary} jws-public-theme`} lang={locale}>
    <PreviewMotion rootId={preview ? "emerald-preview" : "emerald-home"} />
    <a className={styles.skip} href="#main-content">{t.skip}</a>
    {preview && <div className={styles.preview}><span>PHASE B · {t.preview}</span><Link href="/">{t.current} <Arrow /></Link></div>}
    <div className={styles.opening}>
      <PreviewNavigation locale={locale} role={role} homeHref={preview ? "/design-preview/emerald-sanctuary" : "/"} />
      <main id="main-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.panorama}>
            <div className={styles.panoramaShade} />
          </div>
          <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <h1 id="hero-title" className={styles.quranVerse} lang="ar" dir="rtl">{quranVerse}</h1>
            <p className={styles.verseTranslation} lang="en">{quranTranslation}</p>
            <a href={quranSource} className={styles.verseReference} lang="en">Surah Aal-Imran · 3:185 <Arrow /></a>
            <p className={styles.heroDescription}>{t.heroText}</p>
          </div>
          <div className={styles.heroActions}><Link className={styles.primary} href="/request-service">{t.request} <Arrow /></Link><Link className={styles.outlineButton} href="/track-request">{t.track} <Arrow /></Link></div>
          <div className={styles.fleetShowcase}>
            {heroMedia ?? <div className={styles.vehicleScene}>
              <div><Image src="/images/jws/vehicles/vehicle-01.png" alt={locale === "ta" ? "JWS சேவை வாகனம் — Toyota" : "JWS Toyota service vehicle"} fill loading="eager" sizes="(min-width: 1024px) 464px, calc((100vw - 3rem) / 2)" /></div>
              <div><Image src="/images/jws/vehicles/vehicle-02.png" alt={locale === "ta" ? "JWS சேவை வாகனம் — Mahindra" : "JWS Mahindra service vehicle"} fill loading="lazy" sizes="(min-width: 1024px) 464px, calc((100vw - 3rem) / 2)" /></div>
            </div>}
          </div>
          </div>
          {preview && <QuranIntro />}
        </section>
        <LatestActivities locale={locale} />
        <section id="services" className={styles.services} aria-labelledby="services-title">
          <div className={styles.sectionHead}><div><p className={styles.eyebrow}>{t.services}</p><h2 id="services-title">{t.serviceTitle}</h2></div><Link href="/services" className={styles.textLink}>{t.services}<Arrow /></Link></div>
          <div className={styles.serviceGrid}>{services.map((service, index) => <Link className={`${styles.serviceCard} ${service.className}`} href={service.href} key={service.id}>
            <div className={styles.cardTop}><span>0{index + 1}</span><Arrow /></div>
            <div className={styles.serviceContent}><h3>{service.title}</h3><p>{service.description}</p></div>
            {index === 0 && <div className={styles.serviceAura} aria-hidden="true" />}
            {index === 1 && <div className={styles.serviceVehicle}><Image src="/images/jws/vehicles/vehicle-01.png" alt="" fill loading="lazy" sizes="(max-width: 639px) 30vw, (max-width: 959px) 200px, 180px" /></div>}
            <div className={styles.cardAction}>{service.action}<span><Arrow /></span></div>
          </Link>)}</div>
        </section>
        <section id="our-team" className={styles.team} aria-labelledby="team-title">
          <div className={styles.sectionHead}><div><p className={styles.teamEyebrow}>{t.team}</p><h2 id="team-title">{t.leadershipTitle}</h2></div><Link className={styles.textLink} href="/team">{t.meet}<Arrow /></Link></div>
          <LoopingCardRail label={t.team} count={leadershipTeam.length + operationalMembers.length}
            repeat={teamCards(true)}>
            {teamCards()}
          </LoopingCardRail>
        </section>
        {announcements}
        <section id="our-story" className={styles.story} aria-labelledby="story-title"><div className={styles.storyLabel}><p className={styles.eyebrow}>{t.about}</p></div><div className={styles.storyCopy}><h2 id="story-title">{t.purpose}</h2><div className={styles.storyDetails}><p>{t.aboutText}</p><Link href="/about" className={styles.textLink}>{t.learn}<Arrow /></Link></div></div></section>
        <section className={styles.journey} aria-labelledby="journey-title"><div><p className={styles.eyebrow}>{t.guidance}</p><h2 id="journey-title">{t.guidanceTitle}</h2><Link className={styles.textLink} href="/request-service">{t.request}<Arrow /></Link></div><ol>{[{ title: t.step1, text: t.step1Text }, { title: t.step2, text: t.step2Text }, { title: t.step3, text: t.step3Text }].map((step, index) => <li key={step.title}><span>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol></section>
        <section className={styles.support}><div className={styles.supportGlow} aria-hidden="true" /><h2>{t.supportTitle}</h2><p>{t.supportText}</p><Link className={styles.darkButton} href="/support">{t.support}<Arrow /></Link></section>
      </main>
      <footer className={styles.footer}><div className={styles.footerTop}><div><Link href={preview ? "/design-preview/emerald-sanctuary" : "/"} className={styles.brand}><span className={styles.logo}><Image src="/images/jws/logo.png" alt="JWS" width={54} height={54} /></span><span>{t.brand}<small>{t.town}</small></span></Link><p>{t.footerText}</p></div><nav aria-label={t.navigation}>{[{ href: "/", label: t.home }, { href: "/services", label: t.services }, { href: "/team", label: t.team }, { href: "/operations", label: t.activities }, { href: "/contact", label: t.contact }, { href: "/support", label: t.support }].map(link => <Link href={link.href} key={link.href}>{link.label}</Link>)}</nav><nav aria-label={t.staff}><Link href="/employee-access/login">{t.employeeLogin}</Link><Link href="/admin/login">{t.adminLogin}</Link><Link href="/supervisor">{t.supervisor}</Link></nav></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} {t.brand}</span>{preview && <span>Emerald Sanctuary · {t.preview}</span>}<a href="#hero-title">{t.top} ↑</a></div></footer>
    </div>
  </div></PublicLanguage>;
}
