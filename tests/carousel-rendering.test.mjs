import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadServerModule } from "./load-server-module.mjs";

const dictionaries = loadServerModule("lib/i18n.ts");
const language = loadServerModule("components/public-language.tsx", { "@/lib/i18n": dictionaries, "next/navigation": {} });
const motion = loadServerModule("components/use-showcase-motion.tsx", { "@/components/public-language": language });
const doubles = {
  "next/image": ({ src, alt }) => React.createElement("img", { src, alt }),
  "@/components/public-language": language,
  "@/components/use-showcase-motion": motion,
};

test("the card rail wraps at the repeated group and suppresses the copy for reduced motion", () => {
  let effect, observeResize, observeVisibility, frame;
  const viewport = { scrollLeft: 99.5 };
  const refs = [viewport, { getBoundingClientRect: () => ({ left: 0 }) }, { getBoundingClientRect: () => ({ left: 100 }) }];
  const globals = {
    requestAnimationFrame: callback => { frame = callback; return 1; },
    cancelAnimationFrame: () => { frame = undefined; },
    ResizeObserver: class { constructor(callback) { observeResize = callback; } observe() {} disconnect() {} },
    IntersectionObserver: class { constructor(callback) { observeVisibility = callback; } observe() {} disconnect() {} },
  };
  const previous = Object.fromEntries(Object.keys(globals).map(key => [key, globalThis[key]]));
  Object.assign(globalThis, globals);
  try {
    for (const reduced of [false, true]) {
      let ref = 0;
      const { LoopingCardRail } = loadServerModule("components/looping-card-rail.tsx", {
        react: { ...React, useRef: () => ({ current: refs[ref++] }), useId: () => "rail", useState: value => [value, () => {}], useEffect: callback => { effect = callback; } },
        "@/components/public-language": language,
        "@/components/use-showcase-motion": { useShowcaseMotion: () => ({ stopped: reduced, reduced, interaction: {} }) },
        "@/app/design-preview/emerald-sanctuary/sanctuary.module.css": {},
      });
      const rendered = renderToStaticMarkup(LoopingCardRail({ label: "Team", count: 2, children: "Original cards", repeat: "Repeated cards", pixelsPerSecond: 66, pauseButtonOnFocusOnly: true }));
      assert.match(rendered, /sr-only focus:not-sr-only/);
      assert.equal(rendered.includes('aria-hidden="true"'), !reduced);
      assert.equal(rendered.includes("Repeated cards"), !reduced);
      const cleanup = effect();
      if (reduced) {
        assert.equal(cleanup, undefined);
        assert.equal(frame, undefined);
        continue;
      }
      observeResize();
      observeVisibility([{ isIntersecting: true }]);
      frame(100);
      frame(125);
      assert.ok(Math.abs(viewport.scrollLeft - 1.15) < 0.001);
      observeVisibility([{ isIntersecting: false }]);
      assert.equal(frame, undefined);
      cleanup();
    }
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
test("60 supplied employee profiles render only three cards and image requests initially", () => {
  const { TeamCarousel } = loadServerModule("components/team-carousel.tsx", doubles);
  // Synthetic test inputs only; no employee rows are created in any database.
  const members = Array.from({ length: 60 }, (_, i) => ({ name: `Test member ${i + 1}`, position: "Test duty", photo: `/test-only/${i}.webp` }));
  const markup = renderToStaticMarkup(React.createElement(TeamCarousel, { members }));
  assert.equal((markup.match(/<article/g) || []).length, 3);
  assert.equal((markup.match(/<img/g) || []).length, 3);
  assert.ok(markup.includes("1 / 20"));
  assert.ok(!markup.includes("Test member 60"));
  assert.ok(markup.includes('aria-label="Previous"'));
  assert.ok(markup.includes('aria-label="Next"'));
});

test("homepage fetches all explicitly public approved employees once and sends only safe fields", async () => {
  let queries = 0;
  const server = loadServerModule("components/community-showcase.tsx", {
    "@/lib/prisma": { prisma: {
      employeeProfile: { findMany: async query => {
        queries++;
        assert.deepEqual(query.where, { isPublicProfile: true, user: { role: "EMPLOYEE", status: "APPROVED" } });
        assert.equal(query.take, undefined);
        assert.deepEqual(query.orderBy, [{ fullName: "asc" }, { id: "asc" }]);
        for (const field of ["phone", "email", "employeeCode", "userId", "id"]) assert.equal(query.select[field], undefined);
        return Array.from({ length: 60 }, (_, id) => ({ id, fullName: `Test ${id}`, position: "Test duty", photoUrl: null, phone: "PRIVATE", employeeCode: "PRIVATE" }));
      } }, vehicle: { findMany: async () => [] },
    } },
    "@/lib/profile-photo-storage": { profilePhotoSrc: () => null },
    "@/lib/vehicle-image-storage": { vehicleImageSrc: () => null },
    "@/components/community-showcase-client": { CommunityShowcaseClient() {} },
  });
  const element = await server.CommunityShowcase();
  assert.equal(queries, 1);
  assert.equal(element.props.publicTeam.length, 60);
  assert.deepEqual(Object.keys(element.props.publicTeam[0]).sort(), ["name", "photo", "position"]);
  assert.ok(!JSON.stringify(element.props.publicTeam).includes("PRIVATE"));
});
test("team empty state renders without invented names or photos", () => {
  const { TeamCarousel } = loadServerModule("components/team-carousel.tsx", doubles);
  const markup = renderToStaticMarkup(React.createElement(TeamCarousel, { members: [] }));
  assert.ok(markup.includes("approved operational team profiles"));
  assert.ok(!markup.includes("<img"));
});
test("hero uses the existing asset until approved media is supplied", () => {
  const { HeroCarousel } = loadServerModule("components/hero-carousel.tsx", doubles);
  const markup = renderToStaticMarkup(React.createElement(HeroCarousel, { images: [] }));
  assert.ok(markup.includes("/images/jws/home-hero.png"));
  assert.equal((markup.match(/<img/g) || []).length, 1);
});
test("multi-image hero keeps slides mounted for a reduced-motion-aware fade and hides controls", () => {
  const { HeroCarousel } = loadServerModule("components/hero-carousel.tsx", {
    ...doubles,
    "@/components/use-showcase-motion": {
      useShowcaseMotion(count, interval) {
        assert.equal(count, 3);
        assert.equal(interval, 7000);
        return { index: 1, interaction: {} };
      },
    },
  });
  const images = [1,2,3].map(id => ({ src: `/public-media/hero/${id}`, altText: "Test approved caption", caption: null }));
  const markup = renderToStaticMarkup(React.createElement(language.PublicLanguage, { locale: "ta" }, React.createElement(HeroCarousel, { images })));
  assert.equal((markup.match(/<img/g) || []).length, 3);
  assert.equal((markup.match(/aria-hidden="false"/g) || []).length, 1);
  assert.ok(markup.includes("duration-[1200ms]"));
  assert.ok(markup.includes("motion-reduce:transition-none"));
  assert.ok(!markup.includes("<button"));
  assert.ok(!markup.includes("2 / 3"));
});
