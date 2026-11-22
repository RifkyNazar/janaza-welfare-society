# JWS mobile UX refinement — 2026-11-17

## Scope

Inspected Git status and current homepage/public components before edits. Saved
a SHA-256 inventory in the OS temporary directory; final comparison confirms
only the nine existing files listed below changed, plus this new report. All
other pre-existing tracked/untracked work is retained.

No iPhone screenshot attachments were present in this turn. Changes address the
specific problems described by the user; no screenshot match is claimed. Browser
discovery returned no connected apps or browsers.

## Changes

### Leadership

- Homepage and actual `/team` leadership sections use three equal columns at
  mobile, tablet and desktop widths. No horizontal carousel or hidden members.
- Portraits use a compact 4:3 thumbnail frame, a 160px maximum height,
  `object-fit: cover` and `object-position: center 25%`.
- Emerald cards, restrained red role badges, wrapping names and small phone
  rows replace the oversized portrait/contact treatment. Phone targets retain
  at least 44px height, accessible labels and their original `tel:` values.
- Homepage roles retain existing English/Tamil labels. Names, image mapping,
  roles and numbers remain sourced from the untouched leadership data file.
- Team-page responsibility paragraphs remain available on larger screens and
  are hidden on small screens to keep the mobile leadership row compact.
- Portraits are lazy-loaded with one-third-width responsive image hints.

Source-derived homepage thumbnail estimates (not browser measurements):

| Viewport | Columns | Approximate thumbnail width × height |
| --- | --- | --- |
| 375px | 3 | 109 × 82px |
| 390px | 3 | 114 × 86px |
| 430px | 3 | 127 × 96px |
| 768px | 3 | Height capped at 160px |
| 1024px | 3 | Height capped at 160px |
| 1440px | 3 | Grid capped at 960px; height capped at 160px |

### Latest Activities

- Replaced the featured editorial/sidebar layout with three equal compact
  cards, including on mobile. Images use 4:3 frames; titles clamp to two lines
  with full titles preserved in link accessible names. Dates remain localized.
- Existing admin-managed query now takes at most three published records,
  ordered by operation date and ID descending. Existing publication filtering,
  public MANUAL-media filtering and `photos: false` remain intact.
- Zero records show a small localized empty/unavailable state. One/two records
  render only one/two cards; no fabricated activities or filler slots.
- The section retains its clear View all activities link.
- Existing dynamic homepage rendering remains; no caching/polling layer or
  publishing change was introduced. Subsequent requests use the existing data
  flow after an admin publishes an activity.
- Activity images remain lazy and unoptimized at the existing no-store public
  media endpoint. This preserves per-request publication/revocation checks;
  responsive size hints do not create resized variants for these images.
  No private-task-photo endpoint or permission rule was changed.

### Mobile header

- Shared public navigation is a compact floating header below 1024px, with
  authentic logo, full society name, visible language selector and menu button.
- After 72px scroll it becomes a smaller JWS pill. Continued downward travel
  of 72px beyond 260px scroll hides it. Upward travel of 12px reveals it;
  returning within 24px of the top restores the full header.
- A passive scroll listener schedules at most one animation-frame update.
  Only changed data attributes are written; scrolling does not trigger React
  state updates or rerender the page. Direction thresholds reduce jitter.
- Focus inside navigation or an open drawer prevents hiding. Focus entering
  a hidden header reveals it; links retain their full accessible names.
- Transitions use transform/opacity. Reduced-motion removes transitions.
  Fixed-position header state changes do not resize the document flow; inner
  pages reserve the full header space at the top.
- Drawer retains public destinations, language options and role-aware staff
  links, native modal focus/Escape behavior, close button and backdrop handling.
- Desktop public links, language and Staff Access remain unchanged. Existing
  Tamil compact navigation between 1024px and 1279px is retained; full desktop
  Tamil navigation starts at 1280px.

### Density and public consistency

- Mobile homepage body text is 15px; section headings use a fluid 22–26px
  scale. Small thumbnail names/titles are 14px; badge/date/phone metadata is
  smaller. Form controls retain existing 16px sizing for iPhone focus behavior.
- Quran remains unchanged Arabic with explicit RTL semantics, a fluid 32–42px
  size and 1.8 line height. No fixed-height text clipping was introduced.
- Mobile section gaps reduce to 28px. Hero/CTAs, service cards, journey steps,
  support and footer use smaller gaps/padding. Existing destinations remain.
- Shared public-page styles reduce heading/section/card density for Services,
  Team, Activities, Contact, Request Service and Track Request. Forms and
  detailed content retain their existing layouts; three columns apply only
  to the explicit leadership and homepage activity grids.
- Existing reveal motion now targets the new activity tiles instead of the
  removed editorial classes. Reduced-motion behavior is retained.

## Exact files changed this session

1. `app/design-preview/emerald-sanctuary/preview-navigation.tsx` — shared mobile
   scroll behavior, compact brand and visible mobile language selector.
2. `app/design-preview/emerald-sanctuary/sanctuary.module.css` — compact three-card
   grids, mobile typography/spacing, floating-header states and reduced motion.
3. `app/design-preview/emerald-sanctuary/latest-activities.tsx` — limit three,
   equal compact cards, localized empty state, existing privacy filters retained.
4. `app/design-preview/emerald-sanctuary/preview-motion.tsx` — update activity
   reveal target to the new card class.
5. `components/emerald-sanctuary.tsx` — lazy leadership thumbnail sizing and
   move role badges outside the portrait frame.
6. `components/leadership-card.tsx` — compact thumbnail/contact styling hooks
   and smaller responsive image hints for the actual Team page.
7. `app/(public)/team/page.tsx` — explicit three-column leadership grid hook.
8. `app/jws-theme.css` — compact public-page typography/spacing and Team cards.
9. `tests/emerald-homepage.test.mjs` — update query limit; add preservation,
   activity cardinality/privacy and scroll-state regressions.
10. `MOBILE-UX-REFINEMENT.md` — this report.

The shared preview components also serve the actual homepage/public header;
these changes therefore affect the actual site. The preview route is retained.

## Verification

- ESLint: passed, exit 0. Initial run caught the reserved test variable name
  `module`; renamed it, then the final run passed.
- TypeScript: `npx tsc --noEmit` passed, exit 0.
- Automated tests: 35 passed, zero failures. New tests verify all three actual
  leadership contacts/images, lazy thumbnails, zero/one/two/three supplied
  published activities without task photos, and scroll shrink/hide/reveal,
  hysteresis, frame coalescing, focus/drawer pinning and cleanup.
- Production build: passed, exit 0, with process-only `CIRCLE_NODE_TOTAL=2`;
  generated 40 static pages with one worker.
- Local production HTTP: all seven requested public routes returned 200 in
  English/Tamil with selected locale and one header/main. Home and Team contain
  all three original leadership contacts. Request/tracking links return 200.
- The local homepage currently renders zero activity cards. Populated rendering
  was tested with isolated synthetic records only; no real records were added
  or published for testing.
- Anonymous Admin redirects 302 to Admin Login; Employee/Supervisor redirect
  307 to the existing employee login. Existing permission tests pass.
- Focused tracked-file diff whitespace check passed. File hashes confirm
  unrelated existing files, database/auth logic and media sources are unchanged.

## Unverified checks and existing issues

No browser was connected, so actual layouts at 375, 390, 430, 768, 1024 and
1440px were not screenshot-tested. No claim is made that overflow, Arabic/Tamil
shaping/clipping, exact crops, physical touch targets or Safari behavior have
passed a visual audit.

The scroll behavior passes isolated DOM/event simulation, not a real iPhone
interaction test. Drawer/menu/language clicks, keyboard focus restoration,
reduced-motion interaction, dynamic Safari viewport behavior and real
request/tracking submissions remain browser-unverified. Publishing a real
activity and observing it on a subsequent homepage request was not exercised
end to end; query boundaries and existing publishing tests were retained.

Existing external parent lockfile warning remains. The temporary loopback
production server reports Auth.js `UntrustedHost`; authentication configuration
was not changed, and HTTP redirects do not establish authenticated behavior.
No new Lighthouse or CLS measurement is claimed.

No deployment, Git push/reset/clean, database/schema/migration change,
authentication change, private-media permission change or admin publishing
workflow change was performed. Temporary production server was stopped.
