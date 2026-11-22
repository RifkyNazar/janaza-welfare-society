# JWS full application audit

Audit date: 17 November 2026. Scope: the current working tree, including existing uncommitted implementation, local MariaDB, and a locally built production server at port 3100. This is not a certification of the deployed service.

## 1. Executive summary

**The reported registration message is the application's handling of a database unique-constraint violation.** Real Prisma/MariaDB reproduction returned the exact message for both an existing email and an existing employee ID. A registration with unique values reached the success redirect. All audit database writes were inside transactions deliberately rolled back; notifications were replaced with no-ops. Row counts before and after the final reproduction were unchanged. No existing record was edited or removed. Auto-increment counters may advance across rollbacks.

**The exact conflicting field in the user's original attempt remains NOT VERIFIED.** The submitted details and historical request logs were not supplied; the application catches `P2002` without logging its constraint. It would be speculation to name that original field. Neither connectivity failure nor a missing registration column explains this particular message in the inspected code.

The application builds, lint/type checks pass, and 44 automated tests pass, including nine added audit tests. Forty concrete page routes passed anonymous HTTP status/redirect checks. These results do not establish that authenticated workflows work end to end. The production server's Auth.js endpoints return **500 / UntrustedHost** in the current environment, while many pages still return 200 or redirect. No admin, employee, or supervisor test session was established.

Significant findings include silent truncation of service notes/profile duties, placeholder contact information, managed hero/advertisement features disconnected from the live homepage, a historical migration checksum mismatch, arbitrary HTTPS push destinations, and password/registration validation defects. The npm advisory scan reports a CRITICAL dependency entry for Next.js; application-specific exploitation was not attempted. Several HIGH issues require remediation before treating the application as ready for real operational use.

No application implementation, role, business rule, historical migration, environment file, or deployment was changed. Audit additions are this report, `scripts/audit-db.mjs`, `scripts/audit-registration.mjs`, `scripts/audit-http.mjs`, and `tests/audit-regression.test.mjs`. Existing unrelated changes were preserved. No seed, migration application, reset, truncation, push, commit, or deployment was run.

## 2. Employee registration root cause and evidence

Source: `app/actions/auth.ts`, especially `registerEmployee` and its `P2002` catch; `components/employee/registration-form.tsx`; `lib/prisma.ts`; `prisma/schema.prisma` models User and EmployeeProfile.

Registration trims inputs, lowercases email, checks required values, email syntax, lengths, employee-code/phone patterns, a 12-character password minimum and confirmation equality, then bcrypt-hashes at cost 12. A nested User/EmployeeProfile create runs inside a transaction with fixed `EMPLOYEE`, `PENDING`, and `isPublicProfile: false`. Notifications occur after persistence and have separate error handling. Success redirects to `/employee-access/register/success` without signing in.

The exact error string occurs in the `PrismaClientKnownRequestError` / `P2002` branch. Live indexes include `User_email_key`, `EmployeeProfile_employeeCode_key`, and `EmployeeProfile_userId_key`; IDs are generated and the profile is nested under its new user. Neither phone nor name is unique.

Safe real-client reproduction (`npx tsx scripts/audit-registration.mjs`):

| Input case | Database/action result | Persistence |
| --- | --- | --- |
| Unique synthetic email and employee ID | Success redirect reached | Rolled back |
| Existing email; synthetic employee ID | Real database `P2002`; exact reported message | Rolled back |
| Synthetic email; existing employee ID | Real database `P2002`; exact reported message | Rolled back |
| Existing phone; unique email/employee ID | Success redirect reached | Rolled back |

Existing matching values were read internally and never printed. The harness invokes actual registration and real bcrypt/Prisma but substitutes request rate limiting, redirect, auth imports, and notifications; it wraps database access in an outer rollback transaction. It is a database/action integration test, **not a browser form submission or a committed registration**. Only the sanitized error code and action outcome are reported.

The historical failure cannot be narrowed further from available logs: no persisted application log files were found outside dependency/build directories, and registration emits no safe constraint diagnostic. The newly started production server logs expose a separate Auth.js `UntrustedHost` problem, not a registration `P2002` trace.

Recommended registration repair: retain database uniqueness and atomic creation; add a sanitized event recording only an error category/constraint and correlation ID; provide actionable, privacy-conscious duplicate guidance (including pending/rejected-account handling). Do not remove unique indexes, silently replace an account, approve users automatically, or assign new IDs as a workaround. Confirm phone uniqueness policy before changing it. No registration implementation fix was applied because the confirmed failure is a legitimate collision and its original field is unknown; changing disclosure or identity rules needs review.

## 3. Findings by severity

### CRITICAL

**C1 — Critical dependency advisory exposure.** The escalated read-only `npm audit --json` query completed against the npm registry and reported **22 affected package entries: 1 critical, 12 high, 9 moderate** (0 low/info). The critical entry is direct dependency `next`, with reported affected range `16.0.0 - 16.4.4`; the installed project version is 16.3.4. This is registry-reported severity, not a demonstrated exploit in JWS. Review the underlying advisories, reachability, and compatible patched releases, then perform a dedicated dependency-upgrade/regression change. No `npm audit fix`, installation, lockfile update or exploit was executed.

Other reported affected direct dependencies are `next-auth` (high), `nodemailer` (high), `sharp` (high), `prisma` (high), and `@prisma/adapter-mariadb` (moderate). Reported transitive entries include `@auth/core`, `@prisma/config`, `mariadb`, `mysql2`, `deepmerge-ts`, `brace-expansion`, `source-map-js`, `zod`, `fast-uri`, `minimatch`, and TypeScript ESLint packages. These counts include dependency-chain/meta-vulnerability entries and development tooling; they are not 22 independently proven exploitable flaws. Individual advisory IDs/fix versions were not retained by the summary-only command and must be reviewed before choosing upgrades.

### HIGH

**H1 — Production-mode authentication fails in the current environment.** `npm run start -- --port 3100` starts successfully, but `/api/auth/session`, `/api/auth/providers`, and `/api/auth/csrf` each return 500. Server logs repeatedly report `UntrustedHost`. `auth.ts` has no explicit trusted-host configuration; `AUTH_TRUST_HOST`, `AUTH_URL`, and `NEXTAUTH_URL` are unset in the inspected environment. A populated `AUTH_SECRET` does not resolve host trust. Establish an explicitly reviewed canonical URL/proxy trust configuration; do not blindly trust arbitrary forwarding headers. Deployment configuration and real account logins remain unverified. This is separate from the registration unique collision.

**H2 — Valid form input silently loses data in MariaDB.** `app/actions/service-request.ts` accepts `note` up to 2000 characters; `app/employee/(protected)/profile/actions.ts` accepts `duty` up to 2000. Both physical columns are `varchar(191)`, matching their unconstrained Prisma String declarations. Real rollback probes supplied 192 characters and read back **191**, without an exception. Longer notes/duties can be lost while the UI reports success. Align validation/storage using a new forward migration or reviewed shorter limits, and enforce suitable database SQL mode. Do not edit historical migrations. The audit did not submit either live form or modify existing profiles/requests.

**H3 — Arbitrary push endpoint creates a conditional SSRF/outbound-request risk.** `app/api/push-subscriptions/route.ts` accepts any HTTPS URL for an approved staff member. A mocked route test accepted and stored `https://127.0.0.1/push`; there is no provider allowlist, private-address restriction, or subscription quota. `lib/notifications/push.ts` passes persisted endpoints to `webPush.sendNotification`. Outbound exploitation was **not** attempted; actual delivery also depends on VAPID configuration, valid push keys, TLS, DNS, and network reachability. VAPID private configuration is absent locally. Restrict destinations to supported push providers and review outbound network controls, redirects, and quotas.

**H4 — Contact page is not operational.** `app/(public)/contact/page.tsx` displays a dummy phone number, an example email, placeholder service hours, and instructions to replace placeholders. Phone and email are plain text rather than `tel:` / `mailto:` links. HTTP 200 does not make this a usable contact channel. Obtain verified organization details before replacement. Homepage/team leadership phone anchors do exist, but actual call delivery was not attempted.

### MEDIUM

**M1 — Duplicate registration feedback obscures recovery.** Email and employee-ID conflicts return the same generic message with no safe diagnostic. Existing pending/rejected/disabled accounts still occupy unique keys. Real reproduction confirmed both collision paths. Error copy must balance recoverability and enumeration privacy.

**M2 — Registration confirmation is client-only.** The UI's checkbox is required, but the server only copies its value into response state. An automated test omitted confirmation and still reached successful creation/redirect with a mocked database. Validate it on the server if confirmation is an intended requirement.

**M3 — Password handling changes submitted secrets and accepts truncated bcrypt input.** Registration and employee `login` use the trim helper for passwords; `adminLogin` and the Credentials provider use raw passwords. A test confirmed confirmation accepts a value differing by surrounding spaces. The 128-character maximum permits more than bcrypt's 72-byte effective limit; a real bcrypt test confirmed two different 73-byte passwords sharing the first 72 bytes authenticate against the same hash. Define consistent raw-password handling and a byte-aware policy or reviewed hashing migration. Existing credentials must remain compatible.

**M4 — Managed hero and advertisement changes do not reach the live homepage.** `/` renders `EmeraldSanctuary`, which uses two static vehicle assets. The database-backed `HomeHero`/`HeroCarousel` and `AdvertisementBanners` components are not in that entry-point tree. `PublicShell` gives the homepage its own chrome; the public layout does not insert advertisements. Admin save/activation can therefore succeed without changing the live homepage. Wiring these features into the current design requires approval; do not redesign during remediation. Public employee carousel components are likewise absent from `/`, although approved profiles remain available on `/team`.

**M5 — Historical migration checksum differs from the database ledger.** All 11 migration records are finished and not rolled back. `20260904193939_add_request_coordinates` has a different local SHA-256 from `_prisma_migrations.checksum`; neither LF nor CRLF normalization matched it. All other local migration hashes matched. Investigate provenance and agree a forward reconciliation plan. No historical SQL/checksum was changed. No missing scalar column was detected, so this finding alone does not prove current functional schema drift.

**M6 — Rate limiting is per process and trusts supplied client headers.** `lib/rate-limit.ts` stores buckets in a Map and derives identity from `x-forwarded-for`/`x-real-ip`. Account discriminator is combined with client identity, not enforced as a separate global account bucket. Restarts/multiple instances and untrusted forwarded-header injection can weaken throttling; production proxy sanitization was not available to verify. Use a shared limiter and explicit proxy trust. Existing registration/login/tracking/service/donation throttles are present.

**M7 — Legacy image uploads lack decode and metadata sanitization.** Task, profile, vehicle, advertisement and donation image storage validate MIME/size and short signatures, then store original bytes. They do not decode images, limit decoded dimensions, or remove EXIF/location metadata. New hero/manual media storage does use Sharp, a 40-million-pixel cap, orientation/resize and WebP conversion. Private photo delivery remains authorization checked; metadata exposure matters when an image is approved for public use. A complete malicious-file corpus test was not performed.

**M8 — Public visibility cache can outlive a vehicle visibility change.** `app/vehicle-images/[id]/route.ts` returns `public, max-age=3600` to anonymous viewers. Fresh requests recheck `isActive`/`isPublic`, but previously fetched browser/CDN copies can remain available for an hour. Decide whether immediate withdrawal is required and adjust policy accordingly. Task photos, receipts, operation photos and new public media use no-store policies.

**M9 — Race windows exist around photo eligibility and file replacement.** Task upload checks ownership/state before storing a file, then creates the photo and resets submission state without rechecking active task status in the write transaction. A concurrent reassignment can leave an upload attached to retired work. Profile/media replacements read old storage keys before updates; parallel replacements can leave orphan files. These are source-observed concurrency risks, not executed race reproductions. Add transactional predicates/concurrency tests and safe orphan reconciliation before claiming robust behavior under simultaneous edits.

**M10 — Large lists are unbounded.** Public operations/team and supervisor task/employee lists use `findMany` without pagination; several admin lists also fetch full matching sets. Large real datasets can increase query, render, and response cost. Indexes help filtering but do not bound returned data. No load test was run against existing data.

**M11 — Some validation still exceeds database numeric bounds.** Vehicle display order allows any JavaScript safe integer although Prisma Int maps to a database INT. Advertisement order parses arbitrary digit strings without safe-integer/INT bounds, and its date constructor normalizes impossible calendar dates. These paths can produce truncation, database errors, or unintended schedules. No existing records were changed to demonstrate this.

### LOW

**L1 — Staff metrics have presentation caveats.** `TaskAssignment.acceptedAt` defaults to creation time, so a newly assigned task can appear as already “Accepted” before acknowledgement; acknowledgement later overwrites it. Supervisor “Completed Today” uses server-local midnight, while its link lists all completed tasks rather than today's subset. Agree timezone/label/filter semantics without changing business rules silently.

**L2 — Shared UI has inconsistent coverage.** The live homepage uses a separate CSS module/token family; public inner pages/portals use global JWS tokens. The support page and its form include untranslated English strings, while language selection is available site-wide. `PublicShell` wraps children in main, and `/support` renders another main, creating nested main landmarks. Visual/font/contrast checks remain unverified.

**L3 — Public design preview remains exposed.** `/design-preview/emerald-sanctuary` returns 200 and displays preview content. Confirm whether it should ship in production; no private task images were observed or fetched through it.

**L4 — Operational diagnostics and test coverage need improvement.** Several submission handlers log whole exception objects, which can contain Prisma invocation/input context, while registration suppresses all duplicate diagnostics. Use redacted structured events. Existing tests strongly cover selected media and rendering logic but not committed auth/approval/dispatch/browser workflows. The audit's added tests document current defects; passing tests are not evidence those defects are repaired.

## 4. Feature-by-feature verification matrix

PASS applies only to the evidence specified. NOT VERIFIED means no executed end-to-end proof; source presence is not counted as functional success. FAIL can be established by source plus a targeted reproduction even when the full workflow is untested.

| Feature | Result | Evidence / limits |
| --- | --- | --- |
| MariaDB connectivity | PASS | Direct driver and real Prisma calls |
| Registration insertion, pending/private defaults, hashing | PASS (rollback integration) | Real unique create/redirect; cost-12 hash in targeted test; no committed account |
| Browser registration submission and success page transition | NOT VERIFIED | No working browser surface |
| Duplicate email and employee ID | PASS (constraint enforcement), FAIL (diagnostics/recovery) | Real `P2002` exact-message reproduction |
| Duplicate phone prevention | FAIL if uniqueness is required | Existing phone accepted in real rollback test; business policy needs confirmation |
| Required fields/email/phone/ID/password mismatch validation | PASS (unit scope) | Rejected before mocked writes |
| Confirmation and exact password semantics | FAIL | Omitted checkbox accepted; whitespace normalization; bcrypt boundary reproduced |
| Admin/employee/supervisor login, cookies, logout | FAIL locally / NOT VERIFIED end to end | Auth.js endpoints 500; logout actions call `signOut`; no session established |
| Role-based post-login redirects | NOT VERIFIED | Code routes ADMIN/SUPERVISOR/EMPLOYEE separately; no real login |
| Anonymous protected-page access | PASS (HTTP) | All 24 concrete protected pages redirected; detail routes guarded in source |
| Disabled-account revocation at server guard | PASS (unit scope) | Fresh DB status overrides approved JWT in test |
| Public home/about/services/team/vehicles/operations | PASS (HTTP availability only) | 200; content/real-world accuracy not generally certified |
| Contact actions | FAIL | Placeholder data and missing phone/email anchors |
| Footer/internal page navigation | PASS (HTTP link scope) | Discovered server-rendered internal URLs returned expected statuses; client-only/record-specific links not exhaustive |
| Leadership call links | PASS (source only) | `tel:` anchors; no phone call placed |
| Service request creation/PDF | NOT VERIFIED end to end; FAIL long notes | Mock creation test; real 192-to-191 storage probe; no committed request/PDF UI check |
| Request tracking/private projection | PASS (unit scope) | Requires both code and mobile, excludes private contact/address fields; real known-request lookup not executed |
| Donation submission/receipt/PDF | NOT VERIFIED | Validation and admin receipt authorization inspected; no financial submission |
| Admin dashboard statistics | NOT VERIFIED runtime | Real count queries with appropriate status filters in source; no authenticated dashboard comparison |
| Approve/reject/disable/reactivate employees | NOT VERIFIED live | Admin guard, expected-state updateMany, fixed transition map inspected |
| Supervisor promotion/demotion | NOT VERIFIED live | Admin-only, approved-account/profile predicates; no role changed |
| Employee management/profile editing | NOT VERIFIED end to end; FAIL duty preservation | Own identity guard, transaction, public-review reset; real duty truncation |
| Service cancellation | NOT VERIFIED live | Admin-only, NEW-only, compare-and-update in source |
| Dispatch/reassignment | NOT VERIFIED live | Admin/supervisor guard, serializable transactions, unique active request key, historical retention inspected |
| Task visibility and ownership | PASS (source/unit scope) | Employee-profile predicates in list/detail/mutations; no two-account browser test |
| Acknowledge/start/complete workflow | PASS (mock transitions), NOT VERIFIED live | Source expected states; start/complete regression test; no existing task changed |
| Employee self-assignment | PASS (disabled behavior) | Returns explicit supervisor-assignment error; regression tested |
| Availability | NOT VERIFIED live | Own profile and enum validation inspected |
| Photo upload and submit-for-review | NOT VERIFIED end to end | Owner/state predicates and cleanup inspected; concurrency caveat M9 |
| Anonymous/private task photo boundary | PASS (HTTP/unit scope) | Anonymous 404; mocked different-owner query scoped to employee; no private bytes fetched |
| Task photo public approval/revocation | NOT VERIFIED live | Admin guard and reviewer/time fields; no photo approval changed |
| Manual activity draft / task-based draft | PASS (mock scope), NOT VERIFIED live | Admin draft test; task requires completed task/request and approved selections |
| Publish/unpublish | PASS (mock public-boundary scope), NOT VERIFIED live | Required public fields/approval check; public endpoint publication predicates; no publication changed |
| Image upload/delete/replacement | PASS (selected media unit scope), NOT VERIFIED live | New media format/decode/path tests; no existing image deleted or displayed |
| Hero management visible on live homepage | FAIL | Admin implementation is disconnected from `/` |
| Advertisement management visible on live homepage | FAIL | Carousel component is disconnected from `/` |
| Supervisor dashboard/actions | NOT VERIFIED authenticated | Guards and queries inspected; anonymous redirects tested |
| Six-width responsive and interaction audit | NOT VERIFIED | Browser tools unavailable; source/CSS review only |

## 5. Security and privacy review

Server mutation authorization inventory:

| Mutation family | Server requirement | Additional boundary |
| --- | --- | --- |
| Employee approval/public listing/supervisor grants | `requireAdmin` | Fixed status transitions; approved role/profile predicates |
| Operation create/update/publish and hero/manual media save/remove | `requireAdmin` | Selected photo eligibility; manual activity source/id scope |
| Photo approval and donation review | `requireAdmin` | Reviewer identity recorded; donation PENDING-only |
| Request cancellation | `requireAdmin` | NEW-only compare-and-update |
| Vehicle create/update | `requireAdminOrSupervisor` | Validated fields; existing-row lookup |
| Vehicle deactivate/delete | `requireAdmin` | Referenced history blocks delete; see below for policy nuance |
| Assignment/reassignment | `requireAdminOrSupervisor` | Valid employees, serializable transactions, unique active request |
| Employee task/availability/profile/photo actions | `requireEmployee` | Own profile/employee ID; expected task states |
| Push subscription POST/DELETE | Approved staff via fresh DB read | Same-origin check; endpoint ownership; H3 caveat |
| Public registration/service/donation/tracking | Anonymous intentionally | Validation and process-local rate limiting |

All reviewed protected business mutation families have a server guard, not only hidden buttons. `lib/permissions.ts` rereads role/status from the database, limiting stale-JWT access. Proxy JWT claims alone are not treated as sufficient authorization. Public headers still use session claims for navigation, so links can briefly be stale after role/status changes; actual guarded access checks the database.

Vehicle update also accepts `isActive` and `isPublic` from supervisors; therefore the separate admin-only deactivate action does not imply supervisors are unable to make equivalent edits. This is consistent with their current edit form, but should be explicitly approved as policy. No role change was made by the audit.

IDOR review: employee task list/detail and state changes scope to their profile; private task images reread the current account and only allow the owner or an approved admin, excluding supervisors. Profile images require an approved public profile, owner, or admin. Donation receipts are admin-only, no-store, with a sandbox CSP. Anonymous boundary probes passed. Cross-role live sessions and complete object-ID enumeration were not executed.

Public image boundary: public operation image delivery requires both published parent and individually approved task photo. Manual media requires public selection and a published MANUAL parent. Hero delivery requires active media. Homepage activity queries explicitly omit task photos. No private images were opened or included in this report. Existing static `public/images/jws` assets are directly public by design; provenance/consent for those assets was not available to verify.

SQL injection/XSS: reviewed application database access uses Prisma query objects; repository search found no application `$queryRaw`/`$executeRaw` or `dangerouslySetInnerHTML` sink. React escapes ordinary authored text; directions URLs are built/validated in helpers. This is source evidence, not a broad fuzzing result. Current CSP has base/object/frame/form restrictions but no `script-src`/`default-src` policy; it is not a full script-injection mitigation policy.

CSRF/session: Next Server Actions' installed documentation was read for origin/host protections and mandatory action authorization. Push POST/DELETE enforce explicit same-origin. Auth.js supplies its auth endpoints, JWT sessions and production Secure-cookie configuration. Actual cookie flags, logout invalidation, CSRF tokens, session expiry, host/proxy behavior and authenticated cross-origin requests are NOT VERIFIED because local auth endpoints fail. No tokens or passwords were printed. `AUTH_SECRET` exists and is at least 32 characters; entropy/rotation were not assessed.

Error/privacy review: registration response values exclude password/confirmation password; public tracking projects a limited result after two matching credentials. Public team projection excludes phone/email/password. Registration diagnostics are too opaque, while other handlers' complete exception logging warrants redaction. No private records, receipt bytes, task photo bytes or credentials are reproduced here.

## 6. Database and configuration findings

Dependencies inspected: Next 16.3.4, React 19.2.8, Prisma client/MariaDB adapter 7.10.0, NextAuth 5 beta.32, bcryptjs 3.0.3, Sharp 0.35.4, TypeScript/ESLint and test scripts. `lib/prisma.ts` constructs the generated Prisma client with `PrismaMariaDb(DATABASE_URL)` and a development singleton. No `prisma.config.ts` exists, so CLI migration/generation workflows need explicit review before use; none was attempted.

Local database: MariaDB 10.4.32, case-insensitive table-name mode 1, all inspected tables InnoDB. Connection is local according to the parsed URL; credentials/host values were not printed. Remote deployment TLS, grants, backups/restore, encryption, retention and server support/patch status were not validated.

There are 15 application tables plus the migration ledger. All schema scalar columns were found by name, ignoring local table-name casing. This name check is not a complete type/default/index/FK schema diff. Relevant physical field widths were checked separately (H2). All 11 migrations have completed ledger entries; ten hashes match, one does not (M5).

Live unique indexes enforce email, employee code, profile user ID and active request ID. Phone has no uniqueness. Aggregate checks found zero orphan profiles, zero active assignments with absent/mismatched active request keys, and zero exact duplicate phone groups. Phone variants with spacing/country-code differences were not normalized for this check. Full historical relationship/status consistency was not exhaustively queried.

The schema uses restrictive deletes for user profiles, assignments and task photos; operation-media cascade is scoped to parent operations, and request vehicle references use SetNull. Admin vehicle deletion checks historical references and catches FK errors. No user/task/request bulk-delete API was found. Operation editing deletes only selected operation-photo join rows inside its transaction, not task photos/history. Filesystem storage and database changes are not a single atomic unit, so backup and orphan-reconciliation design remains necessary.

`prisma/seed.ts` upserts an admin and overwrites an existing matching account's hash, role and status. **It was not run.** Treat it as an explicit administrative provisioning/reset operation, never as a harmless connectivity test.

`.env` is ignored, `.env.example` is tracked, and runtime `.data` is ignored. Environment inspection reported only configuration-presence/length booleans. SMTP is configured, but delivery was never attempted; VAPID private configuration is absent. Other deployment/provider credentials were not validated or exposed.

## 7. Mobile UI/UX and accessibility

Browser discovery (`cua.getState`) returned no browser/app surfaces. Windows Computer Use initialization succeeded, but `sky.list_apps()` repeatedly failed with native-pipe-unavailable / OS error 2. Consequently there was **no real browser interaction, screenshot review, DOM layout measurement or font-rendering verification**.

| Viewport | Public pages | Admin pages | Employee pages | Supervisor pages |
| --- | --- | --- | --- | --- |
| 375px | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| 390px | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| 430px | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| 768px | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| 1024px | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| 1440px | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |

Source observations, not visual passes:

- Live homepage `sanctuary.module.css` and team-page CSS specify three `minmax(0,1fr)` leadership columns at mobile sizes. Homepage activity tiles also use three compact columns and clamp titles to two lines. At 375px, actual phone-number fit/Tamil wrapping still needs measurement.
- `PreviewNavigation` implements compact/hide/reveal scroll thresholds, reveals on focus, and keeps an open drawer visible. Native dialog/close controls and noscript navigation exist. Scroll, focus restoration, Escape, keyboard trapping and hydration were not exercised in a browser.
- JWS global controls and homepage CSS define focus indicators and touch target sizing. Several portal tables intentionally scroll horizontally. There is no measured page-wide overflow/clipping result.
- Arabic verse has `lang="ar"`, `dir="rtl"` and Arabic font styling. Tamil uses Noto Sans Tamil and language context; dictionary encoding tests pass. Actual glyph shaping, line breaks, fallback/loading and mixed-language reading order remain unverified.
- Reduced-motion CSS and animation-hook checks exist; animations cancel on preference changes. Keyboard/assistive-technology behavior and contrast were not measured.
- Static image paths and public image endpoints are present, but complete asset decode/loading and authenticated image loading were not verified. Public media unit tests cover supported formats/path boundaries.
- Registration has labeled fields, password controls, pending/error feedback and preserved non-password input. Missing server confirmation and generic duplicate feedback remain functional problems. Contact actions and nested support landmarks fail source review.

## 8. Exact tests executed and results

| Command / check | Result | Qualification |
| --- | --- | --- |
| `git status --short`, package/route/schema/migration/source inspection | Completed | Extensive pre-existing modified/untracked work; preserved |
| Installed Next data-security/server-actions guides | Read | Used local version documentation rather than assuming older APIs |
| `npm run lint` | PASS | Initial and post-addition ESLint exit 0 |
| `npx tsc --noEmit` | PASS final | Initial clean; first audit-script TS version caused three typing errors, then converted to MJS; subsequent check passed |
| `npm test` before audit tests | PASS | 35/35 |
| `npm test` after audit tests | PASS | 44/44; nine audit cases document both protections and confirmed defects |
| `npm run build` | PASS | Turbopack compile, TypeScript, all 40 static-generation steps; default 11 workers succeeded, reduction unnecessary |
| `npm run start -- --port 3100` | Starts | Production-mode auth host failures appear during HTTP requests |
| `node scripts/audit-db.mjs` | Completed | Connectivity, metadata/indexes/migrations/integrity checks; checksum and widths findings above |
| `npx tsx scripts/audit-registration.mjs` | Completed | Real registration rollback probes; duplicate phone accepted; 192-character fields stored as 191; before/after row counts unchanged |
| `node scripts/audit-http.mjs` | PASS expected route statuses | 40 concrete pages, 17 discovered URL targets (favicon additional), 9 image/detail boundary probes, 2 push origin/auth probes |
| Anonymous protected pages | PASS | 24 redirects; remaining 16 concrete pages return 200 |
| Push POST cross-origin / anonymous same-origin | PASS rejection | 403 / 401, no database mutation |
| `/api/auth/session`, `/api/auth/providers`, `/api/auth/csrf` | FAIL | Each 500 with server-log UntrustedHost |
| Browser discovery/native helper | BLOCKED | No browser surfaces; missing native pipe |
| Dependency advisory query `npm audit --json` | FAIL security advisory baseline | Initial sandbox registry failure; escalated retry succeeded: 22 entries, 1 critical/12 high/9 moderate; no dependency changes |

Public 200 routes: `/`, `/about`, `/contact`, `/services`, `/team`, `/vehicles`, `/operations`, `/request-service`, `/track-request`, `/support`, `/employee-access`, `/employee-access/login`, `/employee-access/register`, `/employee-access/register/success`, `/admin/login`, `/design-preview/emerald-sanctuary`.

Protected routes tested anonymously: `/admin`, `/admin/advertisements`, `/admin/advertisements/new`, `/admin/donations`, `/admin/employees`, `/admin/hero-media`, `/admin/operations`, `/admin/operations/new`, `/admin/service-requests`, `/admin/supervisors`, `/admin/task-assignments`, `/admin/vehicles`, `/admin/vehicles/new`; `/employee`, `/employee/completed`, `/employee/my-tasks`, `/employee/profile`, `/employee/tasks`; `/supervisor`, `/supervisor/employees`, `/supervisor/requests`, `/supervisor/tasks`, `/supervisor/vehicles`, `/supervisor/vehicles/new`.

Boundary probes: anonymous `/task-photos/1` and `/donation-receipts/1` returned 404; `/admin-media/hero/1` redirected; invalid public-media kind, operation-photo ID, operation ID, advertisement ID, vehicle ID and profile key returned 404. Actual valid private images were never requested. Record-specific successful detail pages, image bytes, client-only navigation/buttons, clipboard/download/map widgets and external link delivery are NOT VERIFIED.

Build warnings mention an ignored lockfile outside the repository and suggest explicit Turbopack/tracing roots. No build failure resulted. The build was completed without changing worker configuration.

## 9. Recommended fixes in order

1. Triage the critical Next.js and high dependency advisories and prepare compatible upgrades with regression checks. Restore production-mode Auth.js operation with reviewed canonical-host/proxy configuration, then use dedicated synthetic accounts to verify admin/employee/supervisor sign-in, sign-out, cookie flags, revocation and cross-role denials.
2. Resolve registration diagnostics/recovery while keeping email/employee-ID uniqueness. Correlate the original failure privately if request context becomes available. Add safe constraint categories rather than logging submitted personal details.
3. Prevent silent note/duty loss with reviewed validation/storage alignment and a new forward migration if needed. Check SQL mode and other field bounds; preserve existing data.
4. Restrict push destinations/quotas and apply consistent byte-aware password/confirmation rules with backward-compatible credential handling. Move throttles to trusted shared storage before multi-instance deployment.
5. Replace contact placeholders using verified organization details and working anchors. Integrate existing managed hero/advertisement features into the approved homepage only after product approval.
6. Investigate the historical migration checksum discrepancy without editing historical files/ledger blindly; agree forward reconciliation and backup/restore verification.
7. Extend legacy upload sanitization, enforce concurrency predicates, review visibility cache behavior and add safe file-orphan reconciliation.
8. Run a dedicated non-production workflow suite covering approvals, dispatch/reassign races, task completion, uploads, photo review/publication/revocation and ownership with at least two employees and a supervisor.
9. Complete the six-width browser/keyboard/font/contrast/overflow audit, add pagination, and resolve translation/landmark/date-label issues without redesigning the site.

## 10. Blocked and unverified checks

- Original failed registration's exact conflicting field: no original input/request correlation and no historical constraint log. Both legitimate collision causes are reproduced; neither is guessed as the original.
- Browser visual checks at all six required widths: browser inventory empty and native helper unavailable.
- Authenticated full workflows: current production-mode auth host failure and no dedicated test sessions. No existing accounts were approved/rejected/promoted/disabled, and no passwords were reset.
- Committed registration, request submission, donation submission, assignment, completion, publication, upload/deletion and notification delivery: deliberately not performed on existing operational data. Only rollback registration/storage-width probes and isolated test fixtures were written.
- Deployed host/TLS/proxy/session behavior, database privileges/backups/restore, remote provider delivery, load/concurrency, asset consent and individual dependency-advisory reachability/fix selection require further evidence.
- This report records confirmed defects and scoped checks; it does not mark the entire application PASS based on successful build or page existence.
