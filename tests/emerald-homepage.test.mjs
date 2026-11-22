import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadServerModule } from "./load-server-module.mjs";

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

async function homepage({ locale = "en", session = null, preview = false } = {}) {
  const { EmeraldSanctuary } = loadServerModule("components/emerald-sanctuary.tsx", {
    "next/image": Image, "next/link": Link,
    "next/headers": { cookies: async () => ({ get: () => ({ value: locale }) }) },
    "@/auth": { auth: async () => session },
    "@/components/public-language": language,
    "@/lib/leadership-team": loadServerModule("lib/leadership-team.ts"),
    [`${base}latest-activities`]: { LatestActivities: () => null },
    [`${base}preview-motion`]: { PreviewMotion: () => null },
    [`${base}preview-navigation`]: { PreviewNavigation },
    [`${base}quran-intro`]: { QuranIntro: () => null },
    [`${base}preview-icon`]: icon,
    [`${base}preview-copy`]: copy,
    [`${base}sanctuary.module.css`]: styles,
  });
  return renderToStaticMarkup(await EmeraldSanctuary({ preview }));
}

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

test("homepage activities select published records and public manual media without querying task photos", async () => {
  const { LatestActivities } = loadServerModule("app/design-preview/emerald-sanctuary/latest-activities.tsx", {
    "next/image": Image, "next/link": Link,
    "@/lib/prisma": { prisma: { operation: { findMany: async query => {
      assert.deepEqual(query.where, { isPublished: true });
      assert.equal(query.select.photos, false);
      assert.deepEqual(query.select.media.where, { isPublic: true, operation: { source: "MANUAL" } });
      assert.equal(query.take, 3);
      return [];
    } } } },
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

test("activity tiles render only actual published records with no task photos or invented slots", async () => {
  for (const count of [0, 1, 2, 3]) {
    const { LatestActivities } = loadServerModule("app/design-preview/emerald-sanctuary/latest-activities.tsx", {
      "next/image": Image, "next/link": Link,
      "@/lib/prisma": { prisma: { operation: { findMany: async query => {
        assert.deepEqual(query.where, { isPublished: true });
        assert.equal(query.take, 3);
        assert.equal(query.select.photos, false);
        return Array.from({ length: count }, (_, index) => ({ id: index + 1, title: `Test published title ${index + 1}`, operationDate: new Date("2026-11-17T00:00:00Z"), photos: [{ id: 999, taskPhoto: { caption: "PRIVATE TASK PHOTO" } }], media: [{ id: index + 10, altText: "Approved public image" }] }));
      } } } },
      "@/lib/public-operations": loadServerModule("lib/public-operations.ts"),
      "./preview-copy": copy, "./preview-icon": icon, "./sanctuary.module.css": styles,
    });
    const html = renderToStaticMarkup(await LatestActivities({ locale: "en" }));
    assert.equal((html.match(/<article\b/g) || []).length, count);
    assert.equal((html.match(/loading="lazy"/g) || []).length, count);
    assert.ok(html.includes('href="/operations"'));
    assert.ok(!html.includes("/operation-photos/"));
    assert.ok(!html.includes("PRIVATE TASK PHOTO"));
    if (!count) assert.ok(html.includes(copy.previewCopy("en").emptyTitle));
  }
});

test("mobile scroll navigation shrinks, hides, reveals and keeps focus or an open drawer visible", () => {
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const effects = [];
  const listeners = new Map();
  const frames = new Map();
  let nextFrame = 1;
  const dialog = { open: false };
  const node = { dataset: {}, contains: element => element === "header-focus", addEventListener: (event, handler) => listeners.set(`header-${event}`, handler), removeEventListener: (event) => listeners.delete(`header-${event}`) };
  const refs = [{ current: dialog }, { current: null }, { current: node }];
  globalThis.document = { activeElement: null };
  globalThis.window = {
    scrollY: 0,
    matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
    addEventListener: (event, handler, options) => { if (event === "scroll") assert.equal(options.passive, true); listeners.set(event, handler); },
    removeEventListener: event => listeners.delete(event),
    requestAnimationFrame: handler => { const id = nextFrame++; frames.set(id, handler); return id; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  try {
    const navigation = loadServerModule("app/design-preview/emerald-sanctuary/preview-navigation.tsx", {
      react: { ...React, useEffect: effect => effects.push(effect), useRef: () => refs.shift() },
      "next/image": Image, "next/link": Link,
      "@/components/public-language": language,
      "./preview-copy": copy, "./sanctuary.module.css": styles,
    });
    navigation.PreviewNavigation({ locale: "en", role: null });
    const cleanup = effects[0]();
    const scroll = y => {
      window.scrollY = y;
      listeners.get("scroll")();
      listeners.get("scroll")();
      assert.equal(frames.size, 1);
      const pending = [...frames.values()]; frames.clear(); pending.forEach(handler => handler());
    };
    assert.equal(node.dataset.scroll, "top");
    scroll(100); assert.equal(node.dataset.scroll, "compact");
    scroll(300); assert.equal(node.dataset.scroll, "hidden");
    scroll(295); assert.equal(node.dataset.scroll, "hidden");
    scroll(280); assert.equal(node.dataset.scroll, "compact");
    document.activeElement = "header-focus";
    scroll(500); assert.equal(node.dataset.scroll, "compact");
    document.activeElement = null; dialog.open = true;
    scroll(700); assert.equal(node.dataset.scroll, "compact");
    dialog.open = false;
    scroll(0); assert.equal(node.dataset.scroll, "top");
    cleanup(); assert.ok(!listeners.has("scroll"));
  } finally {
    if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow;
    if (oldDocument === undefined) delete globalThis.document; else globalThis.document = oldDocument;
  }
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
    const cleanup = effects[1]();
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
