# Emerald Sanctuary Phase C integration — 2026-11-17

## Result

The actual public homepage (`/`) now renders the approved Phase B Emerald
Sanctuary design. The preview remains available at
`/design-preview/emerald-sanctuary`, with its original preview labels and noindex
metadata. Both routes render the same extracted server component and reuse the
existing preview CSS, local translations, icons, navigation, motion, intro and
published-activities component. No dependencies were added.

The homepage retains its public metadata and force-dynamic rendering. Preview
labels and links back to the preview appear only in preview mode. Production
brand links point to `/`. The public layout uses a pathname-aware shell so the
homepage supplies its own header/main/footer without duplication, while other
public routes retain their existing chrome during direct loads and navigation.

The Arabic Quran phrase, English translation/reference, original JWS logo,
vehicle imagery, Tamil/English cookie switching, native Staff access dropdown,
mobile dialog, keyboard focus rules, and reduced-motion behavior are reused.
Intro playback has separate session storage/cookie keys for homepage and preview;
the homepage cookie is scoped to `/`, while preview defaults remain unchanged.

## Data and permissions

- Leadership cards reuse `lib/leadership-team.ts` verbatim, including its existing
  name/photo mapping. No employee account query or invented profiles were added.
  The Team link still opens the existing public team page.
- Latest Activities reuses the preview's existing query: published operations
  only, latest four, public manual-operation media only, `photos: false`.
  Employee task photos are not queried or rendered on the homepage. Empty and
  unavailable states remain localized; no demonstration records were created.
- Request Service, Track Request, Services, Team, Activities, Vehicles, About,
  Contact and Support links use the existing routes and workflows.
- Staff links use the existing approved-session role labels. Only the role is
  passed to navigation, not account IDs, email or other employee details.
- `/supervisor` and its existing `requireAdminOrSupervisor` boundary were verified
  before integration. No permissions, authentication code or workflow was changed.
- Existing public-media delivery still checks selection, publication and MANUAL
  source on every request. Existing protected layouts continue to revalidate
  account permissions. No media endpoint was modified.

## Exact files changed in this session

| File | Change |
| --- | --- |
| `app/(public)/page.tsx` | Replace previous homepage composition with Emerald Sanctuary; retain metadata/dynamic setting. |
| `app/(public)/layout.tsx` | Use the public shell while retaining the language provider and existing header/footer for other routes. |
| `components/emerald-sanctuary.tsx` (new) | Extract approved preview layout; parameterize preview labels, brand destinations and intro/motion scope. |
| `components/public-shell.tsx` (new) | Render homepage without duplicate chrome; retain existing public shell elsewhere. |
| `app/design-preview/emerald-sanctuary/page.tsx` | Render the shared layout in preview mode; retain preview metadata and route. |
| `app/design-preview/emerald-sanctuary/preview-navigation.tsx` | Optional brand destination, defaulting to the original preview route. |
| `app/design-preview/emerald-sanctuary/preview-motion.tsx` | Optional root ID, defaulting to the original preview element. |
| `app/design-preview/emerald-sanctuary/quran-intro.tsx` | Optional cookie path/storage key, retaining original preview defaults. |
| `tests/emerald-homepage.test.mjs` (new) | Six integration/privacy rendering regressions with isolated test doubles. |
| `PHASE-C-INTEGRATION.md` (new) | This report. |

`sanctuary.module.css` was reused without changes in Phase C. Its Phase B recovery
contact-row wrapping fix is retained. The remaining preview files are unchanged.

## Verification

- `npm run lint`: passed, exit 0.
- `npx tsc --noEmit`: passed, exit 0.
- `npm test`: 30 passed, zero failures. Six new tests cover production/preview
  separation, Arabic/Tamil rendering, role links/private-field exclusion, public
  shell behavior and published-media/task-photo query boundaries. Existing
  security/workflow tests also pass. Test doubles do not write application data.
- An initial test run caught an unguarded footer preview label (28 passed,
  2 failed); fixed before the final successful run.
- `npm run build` with process-only `CIRCLE_NODE_TOTAL=2`: passed, exit 0;
  compiled, completed TypeScript and generated 40 static pages using one worker.
- Local production server HTTP checks: English/Tamil `/` return 200, each with
  one header/main/footer and no visible preview labels or task-photo URLs.
- Preview, Services, Team, Activities, Request Service, Track Request, logo and
  cinematic hero image return 200. Preview still contains its Phase B label.
- Anonymous `/admin` redirects 302 to `/admin/login`; `/employee` and
  `/supervisor` redirect 307 to `/employee-access/login`.
- `git diff --check` for the two changed tracked public files: passed. A SHA-256
  snapshot taken before editing verifies all other existing files are unchanged
  except the six existing integration files listed above. Original versions of
  those files were copied to the OS temporary directory before editing.

## Remaining verification and issues

Browser inventory returned no apps or browsers. Desktop/mobile screenshots,
viewport overflow/hero alignment, Arabic diacritics, Tamil wrapping, interactive
language switching, drawer focus/Escape/return focus, client route transitions,
intro playback and reduced-motion switching were not browser-tested. Source
rules are retained; no completed visual/accessibility audit is claimed.

Authenticated role sessions, form submissions, uploads and populated production
activity layouts were not exercised end to end. HTTP checks and isolated unit
tests do not establish those results. Tamil copy still needs native-speaker
editorial review as noted in Phase B.

The temporary production server logged Auth.js `UntrustedHost` for the loopback
test host (`127.0.0.1:3100`). Homepage responses and anonymous redirects above
were observed, but do not validate authentication under a trusted deployment
host. Authentication/trust configuration was deliberately left unchanged.

Build/start report the existing external `C:\Users\Rifky\package-lock.json`
warning. No lockfile or Next configuration was changed to address it.

Initial Git status contained 60 modified tracked files and extensive untracked
work. All pre-existing unrelated work was preserved. No reset, clean, deployment,
Git push, database/schema/migration change, authentication change or
admin/employee workflow modification was performed. The temporary production
server used for HTTP verification was stopped after testing.
