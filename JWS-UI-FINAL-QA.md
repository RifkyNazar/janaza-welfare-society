# JWS public UI final QA

## Original issues / implementation checklist

- [x] Staff Access: fixed-height control, SVG chevron, safe inline padding, tablet breakpoint and tested dismissal handlers.
- [x] Hero fleet: replace absolutely positioned independent images with one in-flow, responsive shared showcase using existing photos.
- [x] Services: explicit transport copy/image/action grid areas, consistent thumbnail and compact padding rules.
- [x] Leadership: non-wrapping phone rows and aligned icons; retain three compact cards and existing public responsibilities on demand.
- [x] Public foundations: scoped palette/tokens/container and control consistency; retain root staff tokens.
- [x] Public HTTP/language/link/privacy regressions and required build/test commands.

The four referenced screenshots are not attached in the accessible conversation. Browser discovery returned no available surfaces. Screenshot comparison and rendered viewport measurements remain unverified; final results will be recorded below.

## Scope and safeguards

17 November 2026. Changes apply to the actual homepage (`app/(public)/page.tsx` renders `EmeraldSanctuary`) and shared public components. Existing shared files happen to live under `app/design-preview/emerald-sanctuary`; these are already imported by the live site. No new preview was created. The existing preview shares some refinements as a consequence of those existing imports.

Inspected the Git working tree before editing and preserved the extensive pre-existing modifications. No backend action, auth configuration, database query/projection, role, permission, schema, migration, environment file, package dependency, original photo or brand asset was changed during this refinement. No database registration/request/approval/publication/upload mutation, seed, reset, commit, push or deployment was performed. Automated tests use mocks or temporary image fixtures, not operational records. HTTP probes are read-only except anonymous push POST rejection probes, which return before persistence.

## Exact files changed in this refinement

| File | Change |
| --- | --- |
| `components/emerald-sanctuary.tsx` | Shared fleet showcase after CTAs, responsive loading/sizes, transport thumbnail, public leadership anchors and explicit LTR phone numbers, public theme scope |
| `app/design-preview/emerald-sanctuary/preview-navigation.tsx` | SVG disclosure chevron, focus-leave dismissal, shared 1279px compact-navigation query |
| `app/design-preview/emerald-sanctuary/sanctuary.module.css` | Token aliases, header/control sizing, hero flow/showcase, transport grid, leadership rows, compact breakpoints and tap targets |
| `app/jws-tokens.css` | Public-only requested palette and reusable spacing/type/control/radius foundations; root staff palette retained |
| `app/jws-theme.css` | Public containers/headings/forms/footer controls, leadership alignment/details and anchor offsets; no new portal rules |
| `components/public-site-header.tsx` | Public theme scope on shared navigation wrapper |
| `components/leadership-card.tsx` | Stable public profile anchors, translated role labels, LTR phone + right icon, native expandable existing responsibilities |
| `components/operation-card.tsx` | Stable flex card body/CTA placement, 44px detail link target, explicit lazy image loading |
| `components/footer.tsx` | Shared gutter, semantic footer navigation and wrapping links |
| `tests/emerald-homepage.test.mjs` | Updated fleet contract and profile links; added disclosure-dismissal and language-preference interaction tests |
| `tests/public-ui-interactions.test.mjs` | Category/service/contact progression and incompatible selection-reset test with submission disabled |
| `scripts/ui-public-qa.mjs` | Repeatable read-only bilingual page/content/link and public image-optimizer probes |
| `JWS-UI-FINAL-QA.md` | This checklist, evidence and remaining verification limits |

Other dirty/untracked files shown by Git predate this refinement, including the broader audit report and scripts. They were not reverted or included as new refinement work.

## Before / after

### Navbar and Staff Access

Before: text-glyph chevron, unequal intrinsic control sizing, large dropdown offset, symmetric fixed-minimum header tracks, and different English/Tamil tablet thresholds. The staff label and selector could compete for width.

After: Staff Access uses a decorative 16px SVG with a fixed flex basis, 10px label gap and 16px internal side padding. The control and desktop language selector are 44px tall with border-box sizing. The action track uses its intrinsic width instead of a constrained symmetric fraction. Dropdown is bounded to the viewport, opens 8px below its trigger, and retains its original Employee/Admin/Supervisor routes. Native details/summary supports standard disclosure semantics; existing outside-pointer and Escape dismissal remain, and focus leaving the disclosure now closes it. Escape restores focus to summary in the unit test.

Compact navigation now applies through 1279px for both languages. Existing dynamic-island behavior is retained: full header at top, compact after scrolling, hide after sustained downward scrolling, reveal upward or on focus/open drawer. Scroll logic still uses one scheduled animation frame and a passive listener. CSS removes transitions for reduced-motion. A unit test exercises the scroll-state thresholds and focus/drawer exceptions; real mouse/touch/native dialog interactions remain unverified.

### Hero composition

Before: two independent photos were absolutely positioned in the hero background, with hero bottom space reserved using a separate fleet-height variable. This detached content height from image placement. Both were eager and sized to 50vw.

After: the same two JWS photos appear together in one in-flow glass/surface container immediately after the service CTAs. Two equal 3:2 cells share a small gutter, one outer border/radius and a full-width fleet link. Images use object-fit cover without stretching; the second photograph has a different original aspect ratio, so its vertical foreground/background is cropped. Exact crop acceptance still needs browser/screenshot review. Frame aspect ratios reserve space and the removed absolute-position spacer can no longer overlap the text as its height grows. First image remains eager, second is lazy; sizes reflect half the bounded showcase width.

The Quran Arabic string, English excerpt, verse source and main service/tracking CTA routes are unchanged. `lang="ar" dir="rtl"`, Arabic font family and shaping-friendly spacing are preserved. The optional animated `QuranIntro` remains preview-only as it was before; the live page retains `PreviewMotion` section reveals. This task did not silently enable an intro overlay or alter religious text/translations. Translation accuracy was not newly independently certified.

### Actual managed-Hero data flow

1. `/admin/hero-media` reads `prisma.heroMedia`; its existing admin-guarded `MediaForm` calls `saveMedia` in `app/admin/(protected)/media-actions.ts`.
2. Existing upload handling stores media files and `HeroMedia` metadata/active state.
3. `/public-media/hero/[id]` serves only an active hero row; this public boundary remains unchanged.
4. `components/home-hero.tsx` queries active HeroMedia ordered by displayOrder/id and passes its public URLs to `HeroCarousel`, with its existing fallback.
5. **The live `/` imports `EmeraldSanctuary`, not `HomeHero`.** Its showcase uses the two static JWS vehicle photos. Admin-managed hero media is still not connected to the live homepage.

The managed system was not deleted, replaced or bypassed. Integrating those managed images requires a deliberate product decision; the visual refinement does not conceal this existing integration gap. Advertisement integration is also outside this change.

### Service cards

Before: transport copy and image relied on positional grid rows, used a contained/blended thumbnail, and switched to a separate large thumbnail row on mobile. Removing the top metadata row could change placement.

After: explicit meta/copy/image/action grid areas keep text and a bounded 4:3 thumbnail together. Mobile removes the unused meta row and keeps copy/image in two controlled columns. The thumbnail uses the original photo with a normal object-cover crop, consistent radius, no blend mode and lazy delivery. All service cards retain their full-card link and existing destination; action rows share the same minimum target height, spacing and border treatment.

### Leadership and activities

Before: phone text and a large icon competed in a flexible contact row; wrapping/shrinking could misalign cards. Mobile hid responsibility text without another detail control.

After: phone/icon rows use explicit grid tracks, tabular Latin digits, LTR bidi isolation, no-wrap phone text and a smaller decorative icon. The entire phone link remains at least 44px tall. Three compact portraits remain side by side. Homepage names link to matching existing public leaders on `/team`; those anchors have fixed-header scroll clearance. Team-page native details allow the existing public responsibility text to be opened without permanently enlarging all cards. No additional employee fields are queried or exposed. Titles may wrap naturally; exact rendered equal-height alignment is not asserted without a browser.

Activity cards retain published/public media selection. Their bodies now use flex layout to align the details action near the bottom with a 44px target; media stays lazy. Homepage activity tiles remain three compact columns and do not start querying task photos.

### Public design system

Requested forest #062D25, emerald #11664C, ivory #F5F3EB, orange #F5A66A and red #B7444D are scoped to `.jws-public` / `.jws-public-theme`. Existing root tokens and portal rules retain their previous values. Shared public spacing/type/control tokens replace duplicate literal foundations in the homepage module. Header/section/footer gutters use the same bounded container system; intentionally narrow forms keep their reading widths. Public form controls use 16px input text and consistent radius/height/focus styling. Public headings are bounded independently from the Arabic verse. Footer links wrap and have a semantic navigation landmark and minimum touch height.

Breakpoint contracts are documented in the existing CSS and matched in navigation JavaScript: mobile <=639px, stacked service grid <=959px, compact navigation <=1279px, desktop >=1280px. CSS custom properties cannot serve directly as ordinary media-query thresholds, so these thresholds remain explicit literals rather than pretending a variable controls them.

## Responsive checks performed

No browser connection was available (`cua.getState()` returned empty app/browser inventories). The four screenshot references were not available. Therefore no real viewport screenshot, DOM box measurement, horizontal-overflow assertion, clipping check, font-shaping comparison or touch test was possible.

| Width | Expected source configuration reviewed | Rendered layout / interaction result |
| --- | --- | --- |
| 375px | Compact nav, 3 leaders/activities, 2 fleet cells, compact CTA/transport rules | NOT VERIFIED |
| 390px | Same mobile rules | NOT VERIFIED |
| 430px | Same mobile rules | NOT VERIFIED |
| 768px | Compact nav, single-column service grid, shared fleet/leadership grids | NOT VERIFIED |
| 1024px | Compact nav for both languages, desktop service grid | NOT VERIFIED |
| 1280px | Desktop nav with intrinsic staff controls | NOT VERIFIED |
| 1440px | Desktop nav and capped containers/showcase | NOT VERIFIED |

No claim of 95% accuracy, visual perfection, measured zero overflow or full browser QA is made. CSS/source reasoning and server-rendered output do not replace these checks.

## Accessibility checks

- PASS, unit scope: Escape/outside pointer/focus-leave staff disclosure dismissal, focus retained for movement inside disclosure, Escape focus restoration.
- PASS, unit scope: scroll states reveal navigation while focused or while the drawer is open.
- PASS, unit/HTTP scope: Arabic string/RTL attributes and English excerpt retained in both locales; Tamil/English dictionary and cookie preference refresh tests pass.
- PASS, source scope: native summary/details, semantic footer navigation, labeled controls, decorative chevron/icons hidden from assistive technology, LTR phone isolation, 44px phone/detail controls, visible focus outlines and reduced-motion overrides.
- NOT VERIFIED: actual keyboard traversal, native dialog focus trap/return, screen reader announcements, computed contrast, zoom/reflow, full Tamil translation coverage and Arabic/Tamil glyph rendering. Existing partial English content and public leadership responsibilities remain English where authored that way.

## Performance observations

- Original static vehicle files were inspected directly: 2,841,439 and 2,643,965 bytes. Originals were not rewritten.
- Direct Next image-optimizer requests with `w=640&q=75`, WebP accepted, returned 200 and **69,906 / 90,944 bytes**. These are specific response sizes, not an estimated whole-page saving; Next Image already provided optimization before this change.
- Refined sizes correspond to the bounded two-image frame. Second hero photo/transport image explicitly lazy; reserved aspect ratios reduce the opportunity for image-load layout shifts.
- No new runtime package, carousel dependency, generated image or extra database query was added. New expandable public details use native HTML. Existing passive/RAF scroll work and reduced-motion cancellation remain.
- LCP, CLS, INP, Lighthouse scores, cold-start timings, mobile GPU cost of backdrop filters and actual browser image scheduling remain NOT VERIFIED. The module CSS is shared with the existing preview; this task did not split that architecture.

## Test results

| Check | Result / scope |
| --- | --- |
| `npm run lint` | PASS, exit 0 |
| `npx tsc --noEmit` | PASS, exit 0 |
| `npm test` | PASS, **47/47** |
| `npm run build` | PASS production compilation, type checking and 40 static-generation steps; 11 workers succeeded |
| `node scripts/ui-public-qa.mjs` | PASS: seven target pages x English/Tamil = 14 responses, locale/staff-link assertions, applicable hero/form/leader assertions, 2 optimized public-image responses |
| `node scripts/audit-http.mjs` | PASS expected statuses: 40 concrete pages, 17 discovered URLs, 9 boundary probes, 2 anonymous push-origin/auth rejection probes |

Target pages: `/`, `/services`, `/team`, `/operations`, `/contact`, `/request-service`, `/track-request`. HTTP output checks the initial service-category step; contact fields deliberately appear only after category/service selection. A separate unit test invokes the real UI callbacks with synthetic state to confirm vehicle radios, Janazah checkboxes, contact/submission fields and resetting incompatible selections. No service form was submitted.

Existing regression coverage passed for request-code generation (mocked creation), code+phone tracking projection, approved public team fields, published activity selection, private task photo rejection, individual public photo approval, inactive hero denial and authenticated mutation guards. These are scoped unit/source/anonymous HTTP results, not logged-in end-to-end workflow proof.

One existing test initially failed because it required both hero images to be eager and hardcoded the old sizes string. It was updated to assert a shared post-CTA frame, retained authentic sources, correct bounded sizes and first-eager/second-lazy policy. One HTTP assertion initially expected contact fields in the service form's initial step; inspection confirmed intentional staged rendering, and the check was corrected with a separate progression test rather than altering the business flow.

## Remaining issues and unverified items

1. Complete screenshot/browser QA at all seven widths once references and a browser connection are available, particularly 375px phone-row fit, long Tamil labels, Staff Access at 1280px, vehicle crops, focus outlines and mobile drawer behavior.
2. Admin-managed HeroMedia remains disconnected from `/`; the exact flow above is documented rather than silently replacing the managed system.
3. Existing contact placeholders remain; verified organizational contact data is needed before changing them. Source content and business rules were not invented during styling.
4. Earlier audit authentication/validation/dependency issues in `JWS-FULL-AUDIT.md` are outside this visual-only change. Local production requests still log Auth.js UntrustedHost; auth configuration was not changed. No authenticated session, committed registration/request, task mutation or private-media fetch was used for QA.
5. QuranIntro remains preview-only; Arabic/English text was preserved rather than claiming a new independent English/Tamil translation review. Religious-text accuracy and the intro experience require separate evidence if further changes are requested.
6. No new preview, backend redesign, database migration or deployment was made. The local QA server is stopped after verification.

Implemented outcome: refined the actual public navbar, hero fleet composition, transport/service spacing, compact leadership contact rows/detail access, activity actions and public visual foundations. Browser-level appearance and interaction acceptance remain explicitly pending.
