# Operational Team Members implementation

Implemented on 17 November 2026 in the existing JWS application. No application deployment, push, commit, seed, database reset or historical migration edit was performed.

## Result

- Admin navigation now includes **Operational Team** at `/admin/operational-team`.
- The add/edit member form has exactly two inputs: **Full Name** and **Member Photo**. No position, role, phone, email or description input was added.
- A full name and photo are mandatory when adding a member. During editing, the already stored required photo is retained unless a replacement is supplied, so renaming does not require re-uploading the same photo. There is no action to remove a photo while retaining its member.
- Admins can add, rename, replace photos and delete members. Delete uses an explicit browser confirmation and the server requires its confirmation value. Version predicates reject stale edits/deletions rather than silently overwriting another administrator's changes.
- Members added here appear publicly on `/team` as a photo and full name only. Leadership remains in its separate existing section. No employee account, task assignment, supervisor permission or Leadership record is created/modified by member management.

## Persistence and data preservation

Added the independent Prisma model `OperationalTeamMember`: full name and required image bytes, plus internal ID, version and timestamps. There are deliberately no relations to employee authentication records and no private-profile fields.

Photos are durable **MariaDB MEDIUMBLOB data**, saved atomically with the name/replacement. This avoids dependence on application release directories or ephemeral upload files. Normal database backups must include this table; photo data increases backup size. No object storage credentials or external service is required.

Applied the new additive migration `20261117090000_add_operational_team_members` using `npx prisma migrate deploy --config prisma7.config.ts`. Its SQL creates only the new table and name/ID index. Prisma reported this was the only pending migration before application and subsequently reported all 12 migrations up to date. Existing historical migration files and existing data were not altered. The earlier audit's historical checksum discrepancy was not “repaired” as part of this work.

Prisma client output was regenerated from the current schema, retaining the pre-existing HeroMedia/ActivityMedia/Operation schema work. The existing `prisma7.config.ts` was reused without modification.

The old public Operational Team section was a view of approved/public employee accounts and included position/duty. It now reads this separate directory. **Existing employee profiles remain intact and administratively manageable; they were not deleted, copied or converted into directory members.** The new directory starts without invented entries. Admins add the intended public members explicitly using the two-field form. Existing Leadership identities, contact details, photos and links are unchanged.

## Photo security and public delivery

- Accept JPEG, PNG and WebP only; maximum upload 5 MB.
- Decode with Sharp, verify decoded format against declared MIME, reject malformed/mismatched/multipage images, and cap decoded pixels at 40 million.
- Correct orientation and re-encode to WebP within 600 x 750 pixels (without enlargement), stripping EXIF/location metadata; cap normalized output at 3 MB.
- Ignore uploaded filenames and unsupported submitted fields. No filesystem path or remote image URL is accepted.
- `/team-member-photos/[id]` queries only `OperationalTeamMember.photo`. It never queries employee photos, task photos or receipts. Invalid/deleted IDs return 404.
- Serve image/webp with `nosniff` and `Cache-Control: no-store`, so fresh requests reflect replacement/deletion immediately.
- Every mutation and each management page calls the existing `requireAdmin`, which rereads current role and approval status from the database. Existing Next Server Action origin/body-size protections remain in place.

## Public layout and larger teams

`OperationalMembersGrid` renders only image/name card content with a consistent 4:5 image frame, natural name wrapping and lazy images. It specifies **3 columns on mobile**, 4 at the small breakpoint, 5 at medium and 6 at extra-large widths. A dedicated public-only text rule avoids the existing global heading size enlarging compact names. No staff dashboard styling was changed.

The public listing fetches at most 60 names/IDs per page, ordered by full name then ID. It never reads photo blobs into the page's list payload. Pagination follows `membersPage` and anchors to the operational section. Admin management lists at most 24 members per page and selects only name/ID/version metadata. This supports 50+ members without rendering an unbounded set of edit forms or loading all image bytes in one database list query.

## Files changed

- `prisma/schema.prisma` — additive independent model.
- `prisma/migrations/20261117090000_add_operational_team_members/migration.sql` — new table only.
- `generated/prisma/` — regenerated client/types, including `OperationalTeamMember`.
- `lib/operational-member-photo.ts` — bounded image normalization.
- `lib/member-pagination.ts` — bounded page parsing.
- `app/admin/(protected)/operational-team/actions.ts` — guarded create/update/delete and cache invalidation.
- `app/admin/(protected)/operational-team/page.tsx` — add form and paginated management list.
- `app/admin/(protected)/operational-team/[id]/page.tsx` — edit form and deletion control.
- `components/admin/operational-member-form.tsx` — two-field forms, preview, errors and delete confirmation.
- `components/admin/admin-navigation.tsx` — new management link.
- `app/team-member-photos/[id]/route.ts` — database-backed public image route.
- `components/operational-members-grid.tsx` — name/photo-only responsive grid.
- `app/(public)/team/page.tsx` — independent directory listing/pagination; Leadership preserved.
- `app/jws-theme.css` — scoped compact member-name typography.
- `tests/operational-members.test.mjs` — nine targeted regression tests.
- `scripts/test-operational-members-db.mjs` — safe real-database rollback integration test.
- `JWS-OPERATIONAL-TEAM.md` — this report.

All unrelated pre-existing working-tree changes were retained. No dependency/package change was needed.

## Verification

| Check | Result |
| --- | --- |
| `npx prisma validate` | PASS |
| `npx prisma generate --config prisma7.config.ts` | PASS |
| `npx prisma migrate status --config prisma7.config.ts` | PASS after migration: all 12 applied |
| `npm run lint` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm test` | PASS — **56/56**, including 9 new member tests |
| `npm run build` | PASS — production build, type checks and 41 static-generation steps |
| `npx tsx scripts/test-operational-members-db.mjs` | PASS — actual Prisma/MariaDB create, photo decode/read, name edit retaining photo, replacement, version conflicts, confirmation requirement, delete and image 404 |
| `node scripts/ui-public-qa.mjs` | PASS — 14 bilingual public page checks plus public image-optimizer responses |
| `node scripts/audit-http.mjs` | PASS expected statuses — 41 concrete pages, 9 boundary probes, origin/auth rejection checks |
| Anonymous `/admin/operational-team` and `/admin/operational-team/1` | Both redirect to `/admin/login` |
| `/team-member-photos/invalid` | 404 |

The real database integration used synthetic images/names in one transaction which was deliberately rolled back. Member count was unchanged afterward and no synthetic member remains. Redirect/cache/request-auth contexts were stubbed for this harness; it exercised the real action/database/image code, not a logged-in browser session. Commit/restart durability was not separately exercised with a permanent test row. Production actions commit normal database writes; durability comes from database storage rather than browser state or app-local files.

Targeted automated cases verify:

1. Invalid, oversized, spoofed/malformed images rejected; valid photos normalized and metadata stripped.
2. Anonymous users, employees, supervisors, pending admins and disabled admins denied before any member query/write or image preparation.
3. Required name/photo enforced; forbidden extra fields ignored.
4. Name-only edits retain required photo; replacements change bytes; stale updates rejected.
5. Explicit deletion confirmation and current version required; deletion touches only this member model.
6. Exactly two editor inputs; stored photo satisfies edit state; cancelled browser confirmation prevents submission in a handler test.
7. Sixty cards render only photo/name, ignoring extra private properties; mobile three-column/lazy-image contract retained.
8. Public page uses bounded separate-directory queries and separate Leadership/Operational sections.
9. Photo route reads only member bytes; invalid/deleted members return 404.

## Remaining verification limits

Browser surfaces were unavailable in this session. Actual mobile grid geometry, font/crop appearance, touch interaction, native confirmation dialog and logged-in admin browser CRUD are **NOT VERIFIED**. Three-column behavior and two-field forms were checked through source/rendered-markup tests, not screenshots. No 50-person dataset was inserted into operational data; the 60-card test uses synthetic in-memory inputs.

The existing local production Auth.js `UntrustedHost` problem is outside this task and was not changed. Anonymous route protection and server authorization were tested, but this report does not claim successful employee/admin/supervisor browser login. Existing unrelated audit findings remain documented in `JWS-FULL-AUDIT.md`.

No deployment occurred. The local production server was used only for safe HTTP QA and stopped afterward.
