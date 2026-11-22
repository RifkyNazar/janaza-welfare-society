# Emerald Sanctuary — Phase B refinement

Preview: http://localhost:3000/design-preview/emerald-sanctuary

## Scope and changed files

Only these files under `app/design-preview/emerald-sanctuary/` were added or edited in this refinement:

- `page.tsx`
- `sanctuary.module.css`
- `latest-activities.tsx`
- `preview-copy.ts` (new)
- `preview-navigation.tsx` (new)
- `quran-intro.tsx` (new)
- `PHASE-B-QA.md` (new)

Existing `preview-motion.tsx` is reused without changes in this refinement. The live homepage, shared translation files, authentication, permissions, Admin/Employee/Supervisor workflows, Prisma schema and migrations were not edited. Existing uncommitted work was retained. No deployment or Phase C action was performed.

## Quran and imagery

The hero reproduces the requested Arabic opening phrase exactly: **كُلُّ نَفْسٍ ذَائِقَةُ الْمَوْتِ**. English: **Every soul will taste death.** Reference: Surah Aal-Imran 3:185. Reference and English opening clause checked against https://quran.com/en/ali-imran/185. This is the requested opening phrase, not the entire verse.

Arabic uses self-hosted Noto Naskh Arabic through `next/font`, explicit `lang="ar"`, `dir="rtl"`, normal letter spacing, and generous line height. Outfit, Inter, and Noto Sans Tamil remain scoped to this preview.

New hero: `/images/jws/vehicles/vehicle-02.png` (existing 1387 × 1134 public asset). Inspected alongside the fleet cover, previous hero, and community group image; the separate service-vehicle portrait provides a different composition from the previous collage. Emerald shading creates text space while keeping the vehicle visible. No image was generated or altered.

Logo: `/images/jws/logo.png`, the sole matching public logo found, inspected at 1254 × 1254. Reused with contain sizing in the navbar, intro, and footer.

## Intro

- 2.4-second hero-only transition: emerald atmosphere, continuous right-to-left reveal without splitting Arabic glyphs, logo appearance, fade to the hero.
- Session-only preview cookie suppresses repeats across tabs; sessionStorage also suppresses repeat playback in the same tab. No authentication cookie is changed.
- Hidden in server HTML and when JavaScript is unavailable. Skipped for reduced motion, fragment navigation, or unavailable storage.
- Pointer-transparent and never modal. Navbar and service CTAs stay above it and remain usable. Pointer, key, scroll, page hiding, or enabling reduced motion immediately dismiss it.
- No audio, video, loading dependency, intro-skip button, or delay to service links. The accessible Quran text is the persistent hero heading; the duplicate animated visual is hidden from assistive technology.
- Actual timing, session playback, and reduced-motion switching require browser verification.

## Language

Uses the existing `PublicLanguage` provider, `LanguageSelector`, `jws-language` cookie and router refresh. English and Tamil are the existing supported interface languages. No Arabic interface option was invented.

All preview UI copy, navigation, actions, role labels, instructions, activity states, and footer have English/Tamil entries in a preview-local typed dictionary. Tamil is rendered with Noto Sans Tamil. Public names and authored activity titles, descriptions, areas, service types, and photo captions remain unchanged. The Quran stays Arabic; its requested English translation and reference are explicitly English in both interface languages.

Cookie-container HTTP checks verified: English selects English and renders English copy; Tamil selects Tamil and renders Tamil copy. Both return HTTP 200. The language control's actual click/refresh interaction remains browser-unverified. Tamil wording was authored carefully but has not received an independent native-speaker editorial review.

## Navigation and permission verification

Public links: `/`, `/services`, `/team`, `/operations`, `/contact`. Service/support links: `/request-service`, `/track-request`, `/vehicles`, `/about`, `/support`. Each returned HTTP 200. The `/team#administration-team` fragment exists on the destination page.

Staff access:

- `/employee-access/login`, or `/employee` when the current approved session identifies an Employee.
- `/admin/login`, or `/admin` when the current approved session identifies an Admin.
- `/supervisor`, an existing portal with an existing permission model.

Inspected `auth.ts`, `proxy.ts`, `lib/permissions.ts`, and the existing portal layouts. Admin requires an approved Admin; Employee requires an approved Employee; Supervisor permits approved Supervisor/Admin accounts. Protected layouts revalidate account role/status against the database. This preview changes labels/links only; it does not authorize access.

Unauthenticated HTTP checks: `/admin` → 302 `/admin/login`; `/employee` and `/supervisor` → 307 to the existing staff login with callback URLs. Both login pages returned HTTP 200. No credentials were used, so authenticated dashboard behavior and signed-in role labels were not exercised.

Desktop uses a grouped native Staff access menu. Smaller layouts use a native modal dialog with a close button, Escape handling, focus containment, and link dismissal. No-JavaScript navigation links are provided. Runtime keyboard and focus behavior requires browser verification.

## Public data

Leadership source/order/name/contact/photo mapping is reused verbatim from `lib/leadership-team.ts`; only role labels are translated. No employee-profile query was added.

Latest Activities queries only `isPublished: true`, latest four by date/id. Existing media filtering permits only public manual-operation media. The preview explicitly selects `photos: false` and passes an empty task-photo collection to the image helper, excluding employee task photos, including otherwise approved task photos. Empty, missing-photo, and unavailable states are localized. Current local response shows the empty published-activities state; populated-record rendering has not been exercised.

## Responsive and visual QA limits

The connected computer/browser inventory returned no browsers or apps. No screenshots, real viewport measurements, or browser interaction tests were possible. The following are source-level refinements, not claimed visual test passes:

| Width | Source coverage | Actual browser result |
| --- | --- | --- |
| 375px | Two-row navbar, visible language/service access, drawer, wrapping Arabic, stacked CTAs/services/profiles, larger type and touch targets | Not run |
| 768px | Compact navigation, tablet editorial layout, fluid typography | Not run |
| 1024px | Compact navigation, two-column services, responsive section headers/footer | Not run |
| 1440px | Desktop navigation, left Quran composition over full hero, bento services and three leadership cards | Not run |

Still verify Arabic shaping/diacritics, Tamil wrapping, no horizontal overflow/clipping, image composition, contrast, drawer focus/Escape/return focus, language switching, touch behavior, and intro session/reduced-motion behavior at these widths. No claim of a completed accessibility or visual audit is made.

## Checks completed

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- Production build with session-only `CIRCLE_NODE_TOTAL=2`: passed, collecting/generating pages with one worker. No config file was changed. The new Arabic font needed a network-enabled font download after the restricted build could not reach Google Fonts.
- Preview English and Tamil HTTP requests: 200.
- New hero and logo requests: 200.
- Public destinations and unauthenticated protected-route redirects: checked as above.
- Preview-scoped `git diff --check`: clean.
- Build reports an existing external `C:\Users\Rifky\package-lock.json` being ignored; no unrelated lockfile/config was changed.

Phase C remains on hold pending approval.

## Recovery checkpoint — 2026-11-17

Inspected Git status and existing changes before editing. There were 60 modified
tracked files plus untracked work, including this entire preview directory.
All nine preview files were present: `page.tsx`, `sanctuary.module.css`,
`latest-activities.tsx`, `preview-copy.ts`, `preview-icon.tsx`,
`preview-motion.tsx`, `preview-navigation.tsx`, `quran-intro.tsx`, and this report.
Because the preview is untracked, there is no committed Phase B baseline from
which to identify which individual edits preceded the connection loss.

Saved CSS includes shared 76rem container alignment, spacing/type/color tokens,
Arabic and Tamil font rules, glass navigation and compact navigation below
1280px, mobile header/CTA layout, bento services, leadership cards, editorial
activity layout, aligned story/journey/footer sections, focus states and
reduced-motion rules. These rules exist on disk; their presence is not a browser
visual pass.

This recovery changed only:

- `sanctuary.module.css`: allow the leadership contact flex row to wrap when its
  phone number, fixed-size call icon and gap cannot fit within a narrow tablet
  card. This addresses a source-level overflow risk; visual confirmation remains.
- `PHASE-B-QA.md`: append this recovery checkpoint and current check results.

Final checks after the CSS edit:

- `npm run lint`: passed, exit 0.
- `npx tsc --noEmit`: passed, exit 0.
- `npm run build` with session-only `CIRCLE_NODE_TOTAL=2`: passed, exit 0;
  compiled, completed TypeScript and generated 40 static pages with one worker.
- No failed lint, TypeScript or build checks. The build still warns about the
  external `C:\Users\Rifky\package-lock.json`; no config/lockfile was changed.

Browser discovery again returned `apps: []` and `browsers: []`. Consequently
375/768/1024/1440px screenshot QA, Arabic shaping, Tamil wrapping, header/hero
overlap, image composition, drawer keyboard/focus behavior, language switching,
and intro timing/reduced-motion interaction remain unverified. Populated activity
layouts also remain unverified; no database records were created to exercise them.
The earlier HTTP results above are historical, not rerun in this recovery.

No existing work was discarded or reset. No live homepage, database, migration,
authentication or shared application file was edited. Phase C was not started.
