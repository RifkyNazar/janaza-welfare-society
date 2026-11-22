# JWS Phase C refinement — 2026-11-17

## Scope and sequence

Inspected Git status before editing and retained all existing modified/untracked
work. A SHA-256 inventory of existing files was saved in the OS temporary
directory and checked again at completion. No existing files were deleted.
Read the installed Next.js CSS, Image and lazy-loading guidance before changes.

Completed A–D and reported that checkpoint before E–F. Inspected public pages,
shared components, all three staff layouts/navigation components and dashboard
structures before applying their shared visual treatment. No query, mutation,
permission rule, authentication setting or migration was changed.

## Navbar

The prior navbar hid desktop navigation below 1280px while leaving the language
selector and request button visible, producing the reported empty middle area.

- Three-column grid: brand at left, five public links centered, language and
  Staff Access at right. Removed the navbar's Request assistance action.
- Public links remain Home, Services, Team, Activities and Contact, without
  repeating them inside the desktop staff dropdown.
- Employee/Admin links retain existing approved-session role labels and portal
  destinations; other visitors get the existing login destinations. Supervisor
  still uses `/supervisor`, whose existing permission model was inspected.
- English desktop navigation starts at 1024px. Tamil uses compact navigation
  below 1280px to accommodate longer labels. These are source breakpoints,
  not browser-measured fit guarantees.
- Compact layouts have an accessible native modal drawer containing all public
  links, the language selector, staff links and the request CTA. Native dialog
  focus containment, Escape and focus return are retained, along with close and
  backdrop-click handlers. Staff dropdown adds document outside-pointer and
  Escape handling, restores summary focus, and closes on link selection.
- Removed redundant dropdown handlers from the homepage motion component so
  navigation behavior also works independently on inner pages.
- The same navigation now appears on public inner pages, using a solid emerald
  header instead of the floating homepage treatment. Existing footer is themed.

## Hero and authentic images

Inspected both original images and the existing composite
`/images/jws/covers/vehicles-cover.png`. Selected the separate originals for a
responsive composition without the composite's baked-in title/decorative panel:

1. `/images/jws/vehicles/vehicle-01.png` — Toyota, 1536×1024, 2,841,439 source bytes.
2. `/images/jws/vehicles/vehicle-02.png` — Mahindra, 1387×1134, 2,643,965 source bytes.

Both originals remain untouched. Two reserved grid cells use Next Image with
`object-fit: contain`, preserving vehicle proportions and branding. Reserved
fleet height and hero padding keep text/CTAs above the vehicles. At small widths
both photographs remain side by side. This composition needs browser review.

Both images use `sizes="(min-width: 1280px) 608px, 50vw"` and eager loading. No
manual image preload/high-priority designation was added without an LCP trace.
React's rendered output automatically preloads both eager images; selecting a
single actual LCP asset for priority tuning remains pending measurement.

Quran text, translation/reference, Arabic language/direction and original logo
are retained. The covering intro is now restricted to the retained preview;
the live heading appears immediately. Existing reduced-motion rules remain.

## Reusable visual system and pages

`app/jws-tokens.css` defines emerald/forest, ivory/paper, warm orange gradient,
restrained red, typography, container/gutter, spacing, radius, shadow and focus
tokens, plus reusable card and primary/secondary/outline button classes.
`app/jws-theme.css` applies shared treatments to existing public/staff component
structures without copying the homepage composition into dashboards.

Fonts are centralized in `lib/jws-fonts.ts` and applied once at the root:
Inter, Outfit, Noto Sans Tamil and Noto Naskh Arabic. Only Inter is marked for
font preload; other fonts use swap with preload disabled. Existing approved
Arabic text is unchanged. Real browser font timing/shaping remains unverified.

Public presentation covered: homepage, About, Services, Team, Activities,
Contact, Request Service and Track Request. Reused PageHero for compact emerald
heading sections, ivory surfaces, shared cards, controls, focus treatment and
orange primary actions. Removed decorative request/footer ornaments. Other
public routes using the shared shell also inherit the theme.

Admin, Employee and Supervisor retain their task-focused layouts, navigation,
data/forms/actions and route boundaries. Shared PortalBrand adds the authentic
logo and society identity. Emerald sidebars, active navigation treatment,
neutral header/cards, focus states and readable scrollable tables provide the
visual refinement. Authenticated dashboard screenshots were not possible.

## Performance evidence and limits

No browser was connected (`apps: []`, `browsers: []`) and no local Lighthouse
trace/report was supplied. Therefore the actual LCP element could not be
identified. No new Lighthouse score, LCP/FCP/TBT/CLS or Speed Index is claimed.
The user's reported 70 performance / 7.4s LCP remains the only Lighthouse result.

Measured the production Next Image endpoint with WebP acceptance and quality 75:

| Variant | Encoded bytes |
| --- | ---: |
| vehicle-01, width 384 | 29,308 |
| vehicle-02, width 384 | 40,360 |
| Both width-384 variants combined | 69,668 |
| Previous vehicle-02 width-750 variant | 114,636 |

For a 375px viewport at 2× DPR, the half-width size hints allow the 384px variants
instead of the previous full-width image's 750px variant. That specific encoded
image comparison is approximately 39.2% smaller, not an overall page-speed gain
or a measured browser network selection.

Other changes: remove the live intro's covering animation and its client
instance; centralize fonts and reduce explicit font preloads; remove duplicated
menu event listeners; keep below-fold images lazy; reserve image geometry.

Leaflet CSS was moved from the root to the location picker, which is now loaded
through next/dynamic when the existing form reaches its location step. The
loading placeholder has reserved space and status semantics; form state,
coordinates, validation and submission logic are unchanged. This moves the
picker component behind an on-demand JS boundary. However, two production CSS
isolation probes FAILED: Next's default CSS chunking still merges Leaflet rules
into a homepage stylesheet, even after the component split. Final observed
homepage CSS was 137,772 uncompressed bytes across two stylesheet requests.
No CSS-byte savings are claimed. Bundler settings were left unchanged.

## Exact files changed this session

| File | Change |
| --- | --- |
| `app/(public)/layout.tsx` | Use shared public site navigation. |
| `app/admin/(protected)/layout.tsx` | Reuse PortalBrand; retain permission and logout code. |
| `app/employee/(protected)/layout.tsx` | Reuse PortalBrand; retain permission and logout code. |
| `app/supervisor/layout.tsx` | Reuse PortalBrand; retain permission and logout code. |
| `app/layout.tsx` | Apply shared fonts/theme; move Leaflet CSS out of root import. |
| `app/globals.css` | Import shared tokens. |
| `app/jws-tokens.css` (new) | Shared design tokens and reusable variants. |
| `app/jws-theme.css` (new) | Scoped public/staff styling. |
| `app/design-preview/emerald-sanctuary/preview-navigation.tsx` | Centered public navigation, staff action, drawer language, dismissal behavior, solid variant. |
| `app/design-preview/emerald-sanctuary/preview-motion.tsx` | Remove redundant menu listeners. |
| `app/design-preview/emerald-sanctuary/sanctuary.module.css` | Consume tokens, navigation/breakpoints, reserved two-vehicle composition. |
| `components/emerald-sanctuary.tsx` | Two optimized vehicle images, shared root fonts, preview-only intro. |
| `components/public-site-header.tsx` (new) | Server locale/session role projection into shared navigation. |
| `components/portal-brand.tsx` (new) | Shared staff identity/logo. |
| `components/page-hero.tsx` | Reusable themed inner-page heading class. |
| `components/service-card.tsx` | Reuse shared card class. |
| `components/location-picker.tsx` | Colocate Leaflet stylesheet only; map logic untouched. |
| `components/service-request-form.tsx` | Dynamically load existing location picker with a loading placeholder. |
| `lib/jws-fonts.ts` (new) | Centralized Next font declarations. |
| `tests/emerald-homepage.test.mjs` | Add navbar structure/vehicle rendering regressions; remove obsolete font doubles. |
| `PHASE-C-REFINEMENT.md` (new) | This report. |

File hashes confirm every other existing tracked/untracked file is unchanged.
Existing translations, media sources, auth/permissions, actions, database schema,
migrations, generated Prisma files and Next config were not edited.

## Final verification

- ESLint: passed, exit 0.
- TypeScript (`npx tsc --noEmit`): passed, exit 0.
- Automated tests: 32 passed, no failures. Existing request, tracking, media
  security and workflow regressions pass; tests use doubles, not live writes.
- Production build: passed, exit 0, with process-only `CIRCLE_NODE_TOTAL=2`;
  compiled, TypeScript passed, generated 40 static pages with one worker.
- Production HTTP checks: all eight requested public routes returned 200 in
  English and Tamil, with matching HTML language/selected option and one
  header/main landmark. Preview returned 200 with Phase B labeling retained.
- Anonymous Admin: 302 to `/admin/login`; Employee/Supervisor: 307 to existing
  employee login. No authenticated account was used.
- Focused tracked-file `git diff --check`: passed. Whole-tree check reported
  pre-existing trailing whitespace in generated Prisma files; hash comparison
  confirms those files were not changed in this session.
- Existing external parent-directory lockfile warning persists.
- Temporary loopback server logs Auth.js `UntrustedHost`. Observed public
  responses/anonymous redirects do not establish trusted-host authentication.
  No authentication/trust configuration was altered to bypass that warning.

## Responsive matrix and remaining work

| Width | English source layout | Tamil source layout | Browser result |
| --- | --- | --- | --- |
| 375px | Compact navbar/drawer; contained vehicle pair | Same | Not run |
| 768px | Compact navbar/drawer | Same | Not run |
| 1024px | Full three-column navigation | Compact navbar/drawer | Not run |
| 1280px | Full navigation | Full navigation | Not run |
| 1440px | Full navigation | Full navigation | Not run |

Still verify real layout overflow/alignment, vehicle composition, contrast,
Tamil wrapping, Arabic shaping, dropdown/drawer focus and outside/Escape behavior,
language clicks and client navigation. Perform authenticated staff visual QA,
real request/tracking/map interaction checks, and clean production Lighthouse
traces. HTTP checks do not validate interaction, and the existing automated
tests do not replace authenticated end-to-end testing. Tamil editorial review
and the Contact page's existing unverified contact placeholders remain.

No deployment, Git push/reset/clean, schema/migration/authentication business-logic
change, private-media permission change or destructive Git action was performed.
The Phase B preview was retained. Temporary production servers were stopped.
