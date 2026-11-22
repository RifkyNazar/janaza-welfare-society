# Implementation checkpoint

## Audit

The initial working tree contained modified public homepage, vehicles, global CSS,
advertisement carousel, header, hero and operation preview files; and untracked
HOMEPAGE-REDESIGN.md, auto-scroll-rail, community-showcase (server/client),
home-reveals, operations-gallery and use-showcase-motion components. These are
pre-existing user changes and must not be reverted.

Next 16.3.4 / Prisma 7.10 dependencies are retained. Ten historical migrations
exist and must remain unchanged. The existing schema and application already
contain SUPERVISOR functionality; this implementation does not introduce it.
The official logo exists in public/images/jws/logo.png. Public team visibility is
an existing explicit EmployeeProfile flag. Task photos use private .data storage;
operation photo delivery checks both publication and individual photo approval.
The homepage team tab currently receives no employee records. The operation
preview currently takes 12 items. Contact contains unverified placeholder details.

## Plan

1. Inspect current workflows and record baseline checks.
2. Centralize logo palette and add typed, cookie-based public language support.
3. Preserve hero layout while adding accessible media and team carousels.
4. Add HeroMedia and separate ActivityMedia with additive Operation source.
5. Extend existing admin operations, retain task-photo publication checks.
6. Validate schema, generate client, lint, build and document test limits.

No reset, db push, historical migration edits, fake records, or secret output.

## Result and limits

Implemented the theme, public language foundation and core public translations,
hero media management/carousel, explicit public employee approval and team
carousel, and manual activities within the existing Operations workflow.
**This is an incremental localization release, not a fully bilingual site.**
No production deployment was performed. No demonstration content was published.

## 1. Audit findings

- Baseline lint and production build passed before implementation.
- Inspected package versions, all model relationships and migration filenames,
  global styles, header/footer, homepage/hero/showcase, public team/operations,
  employee profile updates, admin operations creation/edit/publication, private
  photo upload/delivery, profile delivery and the Prisma singleton.
- Existing task self-assignment is disabled. Supervisor assignment and employee
  acknowledgement already exist; these were retained instead of re-enabling Accept.
- Public team eligibility exists, but the admin details page lacked a visibility
  mutation. It now supports explicit review/approval and hiding.
- An employee previously could replace a public photo without another review.
  Changes to public name, duty or photo now clear public visibility. Private phone
  and email changes alone do not clear it.
- Contact contains existing unverified phone/email placeholders. No replacement
  contact information was invented.
- Existing map/geolocation, bank-transfer confirmation and staff notification
  features were retained. No new GPS, payment or messaging integration was added.

## 2. Files created

- `lib/i18n.ts`, `lib/tamil-extra.ts`: central typed translation dictionaries.
- `lib/public-media-storage.ts`: separate validated persistent media storage.
- `lib/public-operations.ts`: unified safe public operation/media projection.
- `components/public-language.tsx`, `components/hero-carousel.tsx`,
  `components/team-carousel.tsx`, `components/admin/media-form.tsx`.
- `app/admin/(protected)/hero-media/page.tsx` and
  `app/admin/(protected)/media-actions.ts`.
- `app/public-media/[kind]/[id]/route.ts` and
  `app/admin-media/[kind]/[id]/route.ts`.
- `prisma/migrations/20261116090000_add_hero_and_manual_activity_media/migration.sql`.
- `tests/load-server-module.mjs`, `tests/media-security.test.mjs`,
  `tests/workflow-regression.test.mjs`, `tests/carousel-rendering.test.mjs`.
- This report, plus Prisma-generated `ActivityMedia` and `HeroMedia` model files.

## 3. Files modified

Changes span existing layouts, public page labels and shared public components;
admin Operations actions/list/new/detail/forms; employee details/visibility
actions and own-profile updates; profile image response caching; global CSS;
the central Prisma singleton/schema/generated client; package manifests and
`.env.example`. The existing untracked showcase/motion/gallery components were
extended. A complete working-tree inventory follows at the end and includes
the user's original changes; it is not a claim that every listed file originated
in this implementation.

## 4. Theme

Actual logo asset: `public/images/jws/logo.png`. Pixel-family sampling found
approximately green `#00a800`, orange `#ff6000`, red `#f00008`. These are preserved
as logo tokens. UI green `#087f23`, accent `#b84400`, highlight `#c51620`, dark
green `#103522` and light neutral tokens provide usable contrast. Solid green
buttons use white labels. Shared theme utilities, staff accents, ornaments,
cards, borders, hover and focus states reuse the central variables. No logo or
stock images were created. Existing layout/art direction was retained.

## 5. Tamil / English coverage

The header has desktop/mobile selectors. A one-year SameSite=Lax language cookie
sets server-rendered locale and HTML language; the provider receives that same
locale for hydration. HTTPS sets Secure on the preference cookie. Language does
not enter URLs. Font fallbacks include Nirmala UI, Latha and Noto Sans Tamil.

| Area | Coverage |
| --- | --- |
| Header/footer | Main navigation, access links, menu actions and footer labels |
| Homepage | Hero, community/team/vehicle headings and states, latest activity labels, support preview |
| About / Services | Static headings, descriptions and service cards |
| Team / Vehicles | Main static headings and empty states; authored profile/vehicle content stays as entered |
| Operations / Detail | Main headings, empty states, detail links and section label; authored content stays as entered |
| Request Service | Category/options, contact labels, validation errors, success/status, copy/PDF button labels |
| Track Request | Form labels, errors, status stages and results labels |
| Contact | Headings/labels/instructions; original unverified contact values retained |

Remaining English includes the full Support/bank-transfer confirmation page,
community notice/detail UI, employee access/login/registration pages, generated
PDF contents, date formatting, some helper/ARIA labels and stored tracking service
summary strings. Admin/Employee/Supervisor dashboards remain English. Names,
addresses, bank account details, request/reference codes, captions and authored
descriptions are not automatically translated. Tamil wording still needs a JWS
Tamil-language editorial review. Tests guard against corrupted UTF-8 translations.

## 6–7. Hero behavior and administration

The hero retains its headline, description, links and overall two-column layout.
Active media is ordered by display order then ID. The existing hero asset is the
fallback. Autoplay is 4.5 seconds, with opacity transition, previous/next,
pause/play, arrow-key and swipe navigation. Hover/focus/background visibility and
reduced-motion stop autoplay. Intervals/listeners clean up on unmount.

`/admin/hero-media` supports upload, alt text, caption, ordering, activation,
replacement, removal and authenticated preview. New images default inactive.
Only one file is uploaded per submission, within the existing 6 MB action-body
limit. Public delivery checks current activation every time.

## 8–9. Team and employee privacy

One employee query selects only full name, position and photo, with all three
eligibility filters: role EMPLOYEE, status APPROVED, isPublicProfile true.
Ordering is full name then ID; there is no take:3 limit. The client receives no
employee IDs, phone numbers, emails, account status or employee codes.

The Operation Team tab renders 3/2/1 cards on desktop/tablet/mobile and advances
one group every second. It loops with manual controls, hover/focus pause, reduced
motion, keyboard and touch support. Only visible cards mount images. The tab
unmounts its slider when another category is selected. Community Leaders stays
separate. Missing photos use initials and no eligible records produce an empty
state. The full Team page remains available.

Admin review/visibility controls are on the existing employee detail page.
Profile-photo responses now use no-store so newly revoked visibility is checked
on subsequent requests instead of being cached for an hour.

## 10–11. Manual activities and existing operation compatibility

`/admin/operations` includes Add Latest Activity. With no taskId,
`/admin/operations/new` creates a manual private draft. With taskId, the existing
completed-task creation flow is retained. The form supports title, short/full
description, category/service type, public area and date. After saving, the same
detail screen supports editing, uploading/selecting/captioning/ordering images,
publication and unpublication.

Manual images do not manufacture a task assignment or TaskPhoto. Upload alone
does not select an image, and selecting alone does not publish its activity.
Existing task-photo approval and operation publishing checks remain in place.
Public listing/detail/homepage queries use the same Operation model, with date
descending and ID descending for ties. The homepage takes the latest three.

## 12–13. Schema and migration

Added OperationSource (TASK_BASED / MANUAL), Operation.source, HeroMedia and
ActivityMedia. TaskAssignment, TaskPhoto and OperationPhoto relations are unchanged.
Existing task-linked operations default TASK_BASED; standalone operations are
classified MANUAL. No historical migration was edited.

**Applied locally:** `20261116090000_add_hero_and_manual_activity_media`.
Prisma migrate status reports the database up to date.

`migrate dev` reported an existing checksum mismatch for
`20260904193939_add_request_coordinates` and requested a reset. No reset ran.
A read-only live-schema diff confirmed only the reviewed additive changes were
needed, and migrate status showed this was the only pending migration. It was
then applied to verified localhost using `migrate deploy`, followed by generate.
The historical checksum mismatch remains unresolved and can still block future
`migrate dev`. Restore/reconcile the original applied migration from an
authoritative backup before further development migrations; do not reset data.

## 14. Media storage and authorization

New media uses JWS_MEDIA_DIRECTORY, or `.data/public-media` locally, with separate
hero/activity subdirectories. Uploads allow JPEG/PNG/WEBP up to 5 MB, check magic
bytes, decode with sharp under a pixel limit, strip metadata and encode a resized
WEBP at a maximum 1920×1920. Server UUID filenames and key validation prevent
client paths/URLs and traversal. sharp 0.35.4 was already installed transitively
and is now an exact direct dependency; Next/Prisma versions were not upgraded.

All admin mutations/previews call requireAdmin. Public manual media requires
both isPublic and the parent operation's current publication/source. Hero media
requires isActive. Responses use no-store/nosniff and media IDs rather than disk
paths. Files are never written to the Next build/public directory. Existing
private task photos and reviewed operation photo endpoints are unchanged.

## 15–16. Test results and manual checklist

`npm test`: **23 passing unit/security/server-rendering tests**. Test doubles
isolate authentication/database/notifications; these are not full authenticated
end-to-end tests. Storage tests use disposable temporary files. No test employees,
requests or activities were inserted into the actual application database.

| Requested checks | Evidence / remaining work |
| --- | --- |
| 1–2 submission/code | Unit tests validate NEW creation and unique code shape; live form submission still manual |
| 3 copy code | Existing clipboard implementation retained and labels translated; browser clipboard manual |
| 4–5 tracking | Unit test asserts BOTH credentials and safe projection/generic failure; live correct/incorrect credential tests manual |
| 6 registration/approval | Existing flow inspected; authenticated browser test manual |
| 7–8 available/accept | Existing supervisor assignment / disabled self-assignment preserved; tested disabled Accept behavior |
| 9–10 start/complete | Unit tests verify ownership, prior states and both transitions; live transaction tests manual |
| 11–13 upload/review | Existing task photo workflows inspected, not rewritten; authenticated upload/review manual |
| 14–15 operation publishing/photo access | Unit tests retain completed-task eligibility and photo-approval checks; live publish/manual review test pending |
| 16 theme | Central tokens checked; visual contrast/responsive QA manual |
| 17–18 language | Tamil cookie server rendering passed; UI click/reload/cross-page browser test pending; translation incomplete as documented |
| 19 hero controls | Fallback, initial image loading and translated controls tested in server rendering; timing/touch/focus/reduced-motion browser tests pending |
| 20 hero administration | Server validation/authorization tests pass; authenticated upload/edit/remove browser test pending |
| 21–22 team visibility/60 profiles | Query-contract and synthetic 60-profile server-rendering tests pass; no real public employee fixtures created |
| 23–24 team timing/controls | One-second grouped interval implemented; actual browser timing, responsiveness and pause still manual |
| 25 manual draft | Unit test verifies MANUAL/private draft and absence of fabricated tasks/photos |
| 26–29 activity visibility/media | Unit tests verify draft/selection/publication/unpublication checks on every media request; authenticated publish-to-homepage end-to-end test pending |
| 30 existing operations | Real public page HTTP 200; unit eligibility/approval checks pass; authenticated full workflow pending |
| 31 admin authorization | Unit tests ensure authorization precedes upload/storage; anonymous management/preview HTTP redirects verified |
| 32 task privacy | Anonymous real endpoint HTTP 404 and unit guard test pass |

Ten real public routes returned HTTP 200: home, about, services, team, vehicles,
operations, request-service, track-request, contact, support. Invalid media IDs
and anonymous task photos returned 404. Anonymous admin management/preview routes
redirected to login. Production-mode preview logged Auth.js UntrustedHost on the
temporary 127.0.0.1:3100 host; no host-trust/authentication protections were relaxed.
Browser inventory was empty, so no visual/mobile/clipboard or authenticated
browser claim is made.

Final checks also used the pre-existing `http://localhost:3000` development
server. It held an old globally cached Prisma Client after schema generation,
causing initial homepage/Operations 500 responses. A normal Next config-watch
restart (file timestamp only, no configuration/content change or process kill)
refreshed the client. Homepage and Operations then returned 200. Nine core public
routes passed Tamil-cookie text/HTML-language checks on this server. Anonymous
Auth.js session returned 200/null, admin routes redirected, and private task
photos returned 404. The existing dev server was left running; the temporary
production preview was stopped.

Real read-only database verification found zero new hero images, zero manual
activity images and zero currently eligible public employees. Source/task linkage
consistency checks found no invalid classifications. Empty/fallback states are
therefore expected until an administrator supplies approved real content.

## 17–19. Prisma, lint and build

- `npx prisma validate --config prisma7.config.ts`: passed.
- `npx prisma generate --config prisma7.config.ts`: passed (7.10.0).
- `npx prisma migrate status --config prisma7.config.ts`: up to date.
- `npm run lint`: passed after correcting test-helper lint and unused parameters.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed. Existing warning about a parent-directory lockfile
  remains. New media filesystem tracing warnings were resolved with runtime-data
  tracing exclusions; uploaded files are not build assets.
- `git diff --check` passes for application changes. Generated Prisma output has
  generator-produced trailing whitespace; it was not hand-edited.
- npm reported 22 dependency audit findings during the direct-dependency update.
  No audit fix, forced update, or dependency upgrade was run.

## 20. Remaining manual checks

Use actual authorized test accounts in an appropriate non-production environment
to execute the remaining flows in the matrix, including individual photo review,
owner/non-owner access, registration/approval, browser cookie switching, 4.5-second
hero/one-second team timing, reduced-motion, focus/hover, touch, mobile layout,
clipboard/PDF, published image replacement, removal, and immediate revocation.
Do not populate public pages with fake employees or activities for testing.

## 21. Hostinger KVM 2 deployment

Back up the database and all existing private `.data` uploads first. Reconcile
migration history and review/apply migrations separately with the production
deployment procedure (`prisma migrate deploy --config prisma7.config.ts`), then
generate/build and switch the application release. Never run migrate dev/reset
or db push against production.

Use a persistent absolute JWS_MEDIA_DIRECTORY outside release folders, writable
only by the application account, and back it up. The old task/profile/receipt/
vehicle/advertisement `.data` storage must also persist across releases, for
example through a mounted or linked stable `.data` directory. Do not expose
either directory through nginx static aliases. Honor no-store for image routes;
do not add CDN/image-optimizer caching that bypasses publication checks.

Run the existing Node 22 application behind HTTPS/nginx and a process manager.
Allow multipart overhead for the current 6 MB Server Action limit (for example a
7 MB nginx body limit), retain same-origin action validation, and configure the
existing Auth.js production URL/trusted reverse-proxy setup for the actual
deployment hostname. Do not disable host checks just to fix preview warnings.
Keep secrets in protected runtime environment configuration, never Git.

No Hostinger deployment or production migration was executed in this session.

## Working-tree file inventory

Includes preserved pre-existing user edits and untracked files, as described in the checkpoint.

```text
 M .env.example
 M app/(public)/about/page.tsx
 M app/(public)/contact/page.tsx
 M app/(public)/employee-access/page.tsx
 M app/(public)/layout.tsx
 M app/(public)/operations/[id]/page.tsx
 M app/(public)/operations/page.tsx
 M app/(public)/page.tsx
 M app/(public)/request-service/page.tsx
 M app/(public)/team/page.tsx
 M app/(public)/track-request/page.tsx
 M app/(public)/vehicles/page.tsx
 M app/admin/(protected)/employees/[id]/page.tsx
 M app/admin/(protected)/employees/actions.ts
 M app/admin/(protected)/operations/[id]/page.tsx
 M app/admin/(protected)/operations/actions.ts
 M app/admin/(protected)/operations/new/page.tsx
 M app/admin/(protected)/operations/page.tsx
 M app/admin/login/page.tsx
 M app/employee/(protected)/profile/actions.ts
 M app/globals.css
 M app/layout.tsx
 M app/profile-photos/[key]/route.ts
 M components/about-snapshot.tsx
 M components/admin/admin-login-form.tsx
 M components/admin/admin-navigation.tsx
 M components/admin/advertisement-form.tsx
 M components/admin/operation-form.tsx
 M components/admin/vehicle-form.tsx
 M components/advertisement-carousel.tsx
 M components/copy-request-code.tsx
 M components/donation-confirmation-form.tsx
 M components/download-request-pdf.tsx
 M components/employee/login-form.tsx
 M components/employee/registration-form.tsx
 M components/footer.tsx
 M components/header.tsx
 M components/home-hero.tsx
 M components/leadership-card.tsx
 M components/location-picker.tsx
 M components/operation-card.tsx
 M components/operations-preview.tsx
 M components/page-hero.tsx
 M components/request-tracker.tsx
 M components/service-card.tsx
 M components/service-request-form.tsx
 M components/support-panel.tsx
 M generated/prisma/browser.ts
 M generated/prisma/client.ts
 M generated/prisma/commonInputTypes.ts
 M generated/prisma/enums.ts
 M generated/prisma/internal/class.ts
 M generated/prisma/internal/prismaNamespace.ts
 M generated/prisma/internal/prismaNamespaceBrowser.ts
 M generated/prisma/models.ts
 M generated/prisma/models/Operation.ts
 M lib/prisma.ts
 M package-lock.json
 M package.json
 M prisma/schema.prisma
?? HOMEPAGE-REDESIGN.md
?? JWS-IMPLEMENTATION.md
?? app/admin-media/[kind]/[id]/route.ts
?? app/admin/(protected)/hero-media/page.tsx
?? app/admin/(protected)/media-actions.ts
?? app/public-media/[kind]/[id]/route.ts
?? components/admin/media-form.tsx
?? components/auto-scroll-rail.tsx
?? components/community-showcase-client.tsx
?? components/community-showcase.tsx
?? components/hero-carousel.tsx
?? components/home-reveals.tsx
?? components/operations-gallery.tsx
?? components/public-language.tsx
?? components/team-carousel.tsx
?? components/use-showcase-motion.tsx
?? generated/prisma/models/ActivityMedia.ts
?? generated/prisma/models/HeroMedia.ts
?? lib/i18n.ts
?? lib/public-media-storage.ts
?? lib/public-operations.ts
?? lib/tamil-extra.ts
?? prisma/migrations/20261116090000_add_hero_and_manual_activity_media/migration.sql
?? tests/carousel-rendering.test.mjs
?? tests/load-server-module.mjs
?? tests/media-security.test.mjs
?? tests/workflow-regression.test.mjs
```
