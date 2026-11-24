import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadServerModule } from "./load-server-module.mjs";

const rail = { LoopingCardRail: ({ children }) => children };
const base = "@/app/design-preview/emerald-sanctuary/";
const styles = new Proxy({}, { get: (_, name) => name === "__esModule" ? false : String(name) });
const copy = loadServerModule("app/design-preview/emerald-sanctuary/preview-copy.ts");
const icon = loadServerModule("app/design-preview/emerald-sanctuary/preview-icon.tsx", { "./sanctuary.module.css": styles });
const Link = ({ href, children, ...props }) => React.createElement("a", { href, ...props }, children);
const Image = ({ src, alt, sizes, loading }) => React.createElement("img", { src, alt, sizes, loading });
const language = {
  PublicLanguage: ({ children }) => children,
  LanguageSelector: () => React.createElement("select", { "aria-label": "Tamil / English" }),
};
const { PreviewNavigation } = loadServerModule("app/design-preview/emerald-sanctuary/preview-navigation.tsx", {
  "next/image": Image, "next/link": Link,
  "@/components/public-language": language,
  "./preview-copy": copy, "./sanctuary.module.css": styles,
});

async function homepageElement({ locale = "en", session = null, preview = false, operationalMembers = [] } = {}) {
  const { EmeraldSanctuary } = loadServerModule("components/emerald-sanctuary.tsx", {
    "next/image": Image, "next/link": Link,
    "next/headers": { cookies: async () => ({ get: () => ({ value: locale }) }) },
    "@/lib/permissions": { currentStaffRole: async () => session?.user.status === "APPROVED" ? session.user.role : null },
    "@/components/looping-card-rail": rail,
    "@/components/public-language": language,
    "@/lib/leadership-team": loadServerModule("lib/leadership-team.ts"),
    [`${base}latest-activities`]: { LatestActivities: () => React.createElement("section", { id: "latest-activities" }) },
    [`${base}preview-motion`]: { PreviewMotion: () => null },
    [`${base}preview-navigation`]: { PreviewNavigation },
    [`${base}quran-intro`]: { QuranIntro: () => null },
    [`${base}preview-icon`]: icon,
    [`${base}preview-copy`]: copy,
    [`${base}sanctuary.module.css`]: styles,
  });
  return EmeraldSanctuary({ preview, operationalMembers });
}

async function homepage(options) {
  return renderToStaticMarkup(await homepageElement(options));
}

test("service cards retain unique keys across languages even when destinations are shared", async () => {
  function findServiceGrid(node) {
    if (!React.isValidElement(node)) return undefined;
    if (node.props.className === styles.serviceGrid) return node;
    let grid;
    React.Children.forEach(node.props.children, child => { grid ??= findServiceGrid(child); });
    return grid;
  }
  for (const locale of ["en", "ta"]) {
    const grid = findServiceGrid(await homepageElement({ locale }));
    const cards = grid.props.children;
    assert.deepEqual(cards.map(card => card.key), ["janaza", "transport", "community"]);
    assert.deepEqual(cards.map(card => card.props.href), ["/request-service", "/request-service", "/team"]);
  }
});

test("live homepage preserves Quran, branding and service destinations without preview labels", async () => {
  const html = await homepage();
  assert.ok(html.includes(copy.quranVerse));
  assert.ok(html.includes('lang="ar" dir="rtl"'));
  assert.ok(html.includes(copy.quranTranslation));
  assert.ok(html.includes("/images/jws/logo.png"));
  assert.ok(html.includes("/images/jws/vehicles/vehicle-02.png"));
  for (const href of ["/request-service", "/track-request", "/services", "/team", "/operations", "/supervisor"]) {
    assert.ok(html.includes(`href="${href}"`), href);
  }
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  const hero = html.match(/<section[^>]*aria-labelledby="hero-title"[\s\S]*?<\/section>/)[0];
  assert.match(html.slice(html.indexOf(hero) + hero.length), /^<section id="latest-activities"><\/section><section id="services"/);
  assert.ok(!html.includes("PHASE B"));
  assert.ok(!html.includes("Homepage preview"));
  assert.ok(!html.includes('href="/design-preview/emerald-sanctuary"'));
});

test("Tamil homepage renders the existing Tamil dictionary while retaining Arabic and English verse", async () => {
  const html = await homepage({ locale: "ta" });
  assert.ok(html.includes('lang="ta"'));
  assert.ok(html.includes(copy.previewCopy("ta").request));
  assert.ok(html.includes(copy.quranVerse));
  assert.ok(html.includes(copy.quranTranslation));
  assert.ok(!html.includes(copy.previewCopy("ta").preview));
});

test("Phase B route keeps its preview labels and preview logo destination", async () => {
  const html = await homepage({ preview: true });
  assert.ok(html.includes("PHASE B"));
  assert.ok(html.includes("Homepage preview"));
  assert.ok(html.includes('href="/design-preview/emerald-sanctuary"'));
});

test("staff navigation uses approved role links without exposing session details", async () => {
  for (const role of ["ADMIN", "EMPLOYEE"]) {
    const html = await homepage({ session: { user: { role, status: "APPROVED", email: "PRIVATE_EMAIL", id: "PRIVATE_ID" } } });
    assert.ok(html.includes(`href="/${role.toLowerCase()}"`));
    assert.ok(!html.includes("PRIVATE_EMAIL"));
    assert.ok(!html.includes("PRIVATE_ID"));
  }
  const html = await homepage({ session: { user: { role: "ADMIN", status: "PENDING" } } });
  assert.ok(!html.includes('href="/admin"'));
  assert.ok(html.includes('href="/admin/login"'));
});

test("public shell avoids duplicate home landmarks and keeps existing chrome on other routes", () => {
  for (const pathname of ["/", "/services", "/team", "/operations"]) {
    const { PublicShell } = loadServerModule("components/public-shell.tsx", { "next/navigation": { usePathname: () => pathname } });
    const html = renderToStaticMarkup(React.createElement(PublicShell, {
      header: React.createElement("header", null, "Existing header"),
      footer: React.createElement("footer", null, "Existing footer"),
    }, "Page content"));
    assert.equal(html.includes("Existing header"), pathname !== "/");
    assert.equal(html.includes("Existing footer"), pathname !== "/");
    assert.equal(html.includes("<main"), pathname !== "/");
    assert.ok(html.includes("Page content"));
  }
});

test("homepage selects only published records with approved task photos and public manual media", async () => {
  const { LatestActivities } = loadServerModule("app/design-preview/emerald-sanctuary/latest-activities.tsx", {
    "next/image": Image, "next/link": Link,
    "@/lib/prisma": { prisma: { operation: { findMany: async query => {
      assert.deepEqual(query.where, { isPublished: true });
      assert.deepEqual(query.select.photos.where, { taskPhoto: { isApprovedForPublic: true } });
      assert.deepEqual(query.select.media.where, { isPublic: true, operation: { source: "MANUAL" } });
      assert.equal(query.take, 6);
      return [];
    } } } },
    "@/components/looping-card-rail": rail,
      "@/lib/public-operations": loadServerModule("lib/public-operations.ts"),
    "./preview-copy": copy, "./preview-icon": icon, "./sanctuary.module.css": styles,
  });
  const html = renderToStaticMarkup(await LatestActivities({ locale: "en" }));
  assert.ok(html.includes(copy.previewCopy("en").emptyTitle));
  assert.ok(!html.includes("/operation-photos/"));
});

test("desktop public navigation is separate from staff actions and drawer includes language and staff access", () => {
  const html = renderToStaticMarkup(React.createElement(PreviewNavigation, { locale: "en", role: null, homeHref: "/" }));
  const desktop = html.match(/<nav class="desktopNav"[^>]*>([\s\S]*?)<\/nav>/)[1];
  for (const href of ["/", "/services", "/team", "/operations", "/contact"]) {
    assert.equal(desktop.split(`href="${href}"`).length - 1, 1);
  }
  assert.ok(!desktop.includes("<details"));
  assert.ok(!html.includes("Request assistance"));
  const tools = html.match(/<div class="navTools">([\s\S]*?)<dialog/)[1];
  assert.ok(tools.includes("<select"));
  assert.ok(tools.includes("<details"));
  assert.ok(tools.includes("Staff access"));
  const drawer = html.match(/<dialog[\s\S]*?<\/dialog>/)[0];
  assert.ok(drawer.includes("<select"));
  for (const href of ["/services", "/employee-access/login", "/admin/login", "/supervisor"]) assert.ok(drawer.includes(`href="${href}"`));
});

test("hero supplies two authentic, responsive vehicle images and retains the main heading", async () => {
  const html = await homepage();
  const hero = html.match(/<section[^>]*aria-labelledby="hero-title"[\s\S]*?<\/section>/)[0];
  const showcase = hero.slice(hero.indexOf('<div class="fleetShowcase">'));
  assert.ok(html.indexOf('class="fleetShowcase"') > html.indexOf('class="heroActions"'));
  for (const [index, filename] of ["vehicle-01.png", "vehicle-02.png"].entries()) {
    const image = showcase.match(new RegExp(`<img[^>]*src="/images/jws/vehicles/${filename}"[^>]*>`))[0];
    assert.ok(image.includes('sizes="(min-width: 1024px) 464px, calc((100vw - 3rem) / 2)"'));
    assert.ok(image.includes(`loading="${index === 0 ? "eager" : "lazy"}"`));
  }
  assert.ok(html.includes('id="hero-title"'));
  assert.ok(!hero.includes('href="/vehicles"'));
});

test("all three real leadership contacts and lazy thumbnail sources remain on the homepage", async () => {
  const html = await homepage();
  const team = html.match(/<section id="our-team"[\s\S]*?<\/section>/)[0];
  const { leadershipTeam } = loadServerModule("lib/leadership-team.ts");
  assert.equal((team.match(/<article\b/g) || []).length, 3);
  for (const member of leadershipTeam) {
    assert.ok(team.includes(member.name));
    assert.ok(team.includes(`href="tel:${member.contact}"`));
    assert.ok(team.includes(`src="${member.photoSrc}"`));
    assert.ok(team.includes(`href="/team#leader-${member.position.toLowerCase()}"`));
  }
  assert.equal((team.match(/loading="lazy"/g) || []).length, 3);
});

test("operation tiles render real titles, detail links and both approved image sources", async () => {
  for (const count of [0, 1, 2, 3]) {
    const { LatestActivities } = loadServerModule("app/design-preview/emerald-sanctuary/latest-activities.tsx", {
      "next/image": Image, "next/link": Link,
      "@/lib/prisma": { prisma: { operation: { findMany: async query => {
        assert.deepEqual(query.where, { isPublished: true });
        assert.equal(query.take, 6);
        assert.deepEqual(query.select.photos.where, { taskPhoto: { isApprovedForPublic: true } });
        return Array.from({ length: count }, (_, index) => ({ id: index + 1, title: `Test published title ${index + 1}`, operationDate: new Date("2026-11-17T00:00:00Z"), photos: index % 2 === 0 ? [{ id: 999, taskPhoto: { caption: "Approved task photo" } }] : [], media: [{ id: index + 10, altText: "Approved manual image" }] }));
      } } } },
      "@/components/looping-card-rail": rail,
      "@/lib/public-operations": loadServerModule("lib/public-operations.ts"),
      "./preview-copy": copy, "./preview-icon": icon, "./sanctuary.module.css": styles,
    });
    const html = renderToStaticMarkup(await LatestActivities({ locale: "en" }));
    assert.equal((html.match(/<article\b/g) || []).length, count);
    assert.equal((html.match(/loading="lazy"/g) || []).length, count);
    assert.ok(html.includes('href="/operations"'));
    if (count) assert.ok(html.includes('/operation-photos/999'));
    if (count > 1) assert.ok(html.includes('/public-media/activity/11'));
    for (let id = 1; id <= count; id++) {
      assert.ok(html.includes('href="/operations/' + id + '"'));
      assert.ok(html.includes("Test published title " + id));
    }
    if (!count) assert.ok(html.includes(copy.previewCopy("en").emptyTitle));
  }
});

test("compact header is in flow and does not cover sections while scrolling", () => {
  const css = readFileSync("app/design-preview/emerald-sanctuary/sanctuary.module.css", "utf8");
  assert.match(css, /\.header,\.header\.solidHeader \{\s*position: relative/);
  assert.doesNotMatch(css, /\.header\[data-scroll/);
});

test("staff disclosure closes on Escape, outside pointer, and leaving focus while retaining focus inside", () => {
  const previousDocument = globalThis.document;
  const previousNode = globalThis.Node;
  const effects = [], listeners = new Map();
  class TestNode {}
  const inside = new TestNode(), outside = new TestNode();
  let focused = false;
  const disclosure = { open: true, contains: target => target === inside, removeAttribute: () => { disclosure.open = false; }, querySelector: () => ({ focus: () => { focused = true; } }) };
  const refs = [{ current: null }, { current: disclosure }, { current: null }];
  globalThis.Node = TestNode;
  globalThis.document = { addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type) };
  try {
    const { PreviewNavigation: Navigation } = loadServerModule("app/design-preview/emerald-sanctuary/preview-navigation.tsx", {
      react: { ...React, useEffect: effect => effects.push(effect), useRef: () => refs.shift() },
      "next/image": Image, "next/link": Link, "@/components/public-language": language,
      "./preview-copy": copy, "./sanctuary.module.css": styles,
    });
    const tree = Navigation({ locale: "en", role: null });
    function find(element, type) { if (!element || typeof element !== "object") return null; if (element.type === type) return element; for (const child of React.Children.toArray(element.props?.children)) { const found = find(child, type); if (found) return found; } return null; }
    const details = find(tree, "details");
    const cleanup = effects[0]();
    listeners.get("pointerdown")({ target: inside }); assert.equal(disclosure.open, true);
    listeners.get("keydown")({ key: "Escape" }); assert.equal(disclosure.open, false); assert.equal(focused, true);
    disclosure.open = true;
    listeners.get("pointerdown")({ target: outside }); assert.equal(disclosure.open, false);
    disclosure.open = true;
    details.props.onBlur({ currentTarget: disclosure, relatedTarget: inside }); assert.equal(disclosure.open, true);
    details.props.onBlur({ currentTarget: disclosure, relatedTarget: outside }); assert.equal(disclosure.open, false);
    cleanup(); assert.equal(listeners.size, 0);
  } finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
    if (previousNode === undefined) delete globalThis.Node; else globalThis.Node = previousNode;
  }
});

test("language selector writes the chosen preference and refreshes without changing destinations", () => {
  const previousDocument = globalThis.document, previousLocation = globalThis.location;
  let refreshed = 0;
  globalThis.document = { cookie: "" }; globalThis.location = { protocol: "https:" };
  try {
    const { LanguageSelector } = loadServerModule("components/public-language.tsx", {
      react: { ...React, useContext: () => "en" },
      "@/lib/i18n": loadServerModule("lib/i18n.ts"),
      "next/navigation": { useRouter: () => ({ refresh: () => refreshed++ }) },
    });
    const tree = LanguageSelector();
    const select = React.Children.toArray(tree.props.children).find(child => child.type === "select");
    for (const locale of ["ta", "en"]) {
      select.props.onChange({ target: { value: locale } });
      assert.ok(document.cookie.startsWith(`jws-language=${locale}; Path=/;`));
      assert.ok(document.cookie.includes("SameSite=Lax; Secure"));
    }
    assert.equal(refreshed, 2);
  } finally {
    if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument;
    if (previousLocation === undefined) delete globalThis.location; else globalThis.location = previousLocation;
  }
});

test("leadership contacts stay with their own profile and operational members use uploaded photo endpoints", async () => {
  const html = await homepage({ operationalMembers: [{ id: 19, fullName: "Test operational member" }] });
  const team = html.match(/<section id="our-team"[\s\S]*?<\/section>/)[0];
  const cards = team.match(/<article\b[\s\S]*?<\/article>/g);
  assert.equal(cards.length, 4);
  for (const [index, asset, name, phone] of [
    [0, "treasurer.png", "MHS. Hameed", "0777378753"],
    [1, "secretary.png", "SM. Firthous", "0774203109"],
    [2, "president.png", "ABM. Haroon", "0775525806"],
  ]) {
    assert.ok(cards[index].includes(asset));
    assert.ok(cards[index].includes(name));
    assert.ok(cards[index].includes("tel:" + phone));
  }
  assert.ok(cards[3].includes("/team-member-photos/19"));
  assert.ok(cards[3].includes("Test operational member"));
});
