# Operational Team runtime fix

Date: 17 November 2026. Fixed in the existing working tree; no application deployment, push, commit, database reset, historical migration edit, authentication change or existing-data replacement.

## Exact error and cause

The development server log `.next/dev/logs/next-development.log` records:

```text
TypeError: Cannot read properties of undefined (reading 'count')
at OperationalTeamAdmin (app/admin/(protected)/operational-team/page.tsx:12:52)
const count = await prisma.operationalTeamMember.count();
```

**Prisma error code: none.** This is a JavaScript TypeError, not a Prisma `P2021` missing-table error or database connection exception. `prisma.operationalTeamMember` was undefined, so no count query could be sent to MariaDB.

The root cause was the development singleton in `lib/prisma.ts`. It previously reused `globalThis.prisma` whenever any instance was present. The running Next dev process started before the new member model/client generation and retained that old client through hot reload. A generated client on disk does not add new model delegates to an already constructed client object.

Supporting evidence:

- Repeated server/browser log entries identify the same missing-delegate TypeError and exact page line.
- The model exists in `prisma/schema.prisma`; current generated client types/runtime include the `operationalTeamMember` delegate.
- The active MariaDB database contains the corresponding table, including the required name/photo/version columns. The metadata scan found no missing scalar column.
- `npx prisma migrate status --config prisma7.config.ts` reports all **12 migrations applied**. No migration was pending.
- A fresh-process Prisma/MariaDB member workflow test passed before the fix, while `/team` on the existing long-lived dev server returned **500** with the same missing-delegate error.
- After changing the cache lifecycle, that same running development server returned `/team` **200**, with no restart, missing-delegate error or fallback result.

## Fix

`lib/prisma.ts` now reuses a development client only when both its generated PrismaClient constructor and database configuration match the currently imported constructor/configuration. It replaces pre-existing unversioned clients and clients made obsolete by regenerated code or a changed connection configuration. Superseded pools are disconnected; the current client remains cached for ordinary module reloads.

Production construction does not reuse a development global instance. Credentials remain server-side and are never printed. No optional chaining, empty-list fallback, caught count error, new permission bypass, table rename or migration workaround was added. Actual database/query failures remain visible.

Changed files for this fix:

1. `lib/prisma.ts` — development client cache identity and pool lifecycle.
2. `tests/prisma-cache.test.mjs` — reproduces the exact old missing-delegate failure and verifies replacement, reuse, regeneration/config changes and production isolation.
3. `scripts/verify-operational-members-persistence.mjs` — committed persistence/public delivery/edit/replacement/deletion verification using one disposable record.
4. `JWS-OPERATIONAL-TEAM-RUNTIME-FIX.md` — this report.

Existing unrelated modifications, generated client files and migrations were retained. Client regeneration/migration application was unnecessary for this runtime failure because disk generation and the database were already correct.

## Persistence and member workflow verification

Ran `npx tsx scripts/verify-operational-members-persistence.mjs` against the active local database and running website:

| Step | Result |
| --- | --- |
| Use real `requireAdmin` with an actual approved-admin database ID supplied through a test session context | PASS; current database role/status checked |
| Create using Full Name and Photo only, with real validation/Sharp encoding/action/Prisma logic | PASS; normal committed insert |
| Read name and image using a new PrismaClient and separate MariaDB connection | PASS; data survived outside the creating connection/transaction |
| Invoke actual admin page count/list queries under that authorized test context | PASS; page rendered member list |
| Fetch running `/team` and member photo endpoint | PASS; saved test name and correct WebP bytes publicly delivered |
| Commit a name-only edit | PASS; existing photo retained, updated name read from another connection |
| Commit replacement photo | PASS; image bytes changed and new photo/name delivered publicly |
| Delete with explicit confirmation and current version | PASS; row absent afterward and public photo endpoint returns 404 |
| Cleanup | PASS; exact disposable fixture removed and original member count restored |

This was a real committed persistence test, unlike the earlier rollback-only integration. Only the uniquely labeled member created by this invocation was edited/deleted. No existing member, user, employee, service request, task, role or authentication credential was changed. The public test record existed briefly during verification and was then removed. No private record/photo or test-session credential is included in this report.

The browser UI was unavailable (`cua.getState()` returned no connected apps/browsers). The test supplied an authentication-session context to the existing guard and stubbed Next redirect/cache request context; it did not create a login token or change authentication configuration. **A real authenticated-browser form submission/login/confirmation dialog remains NOT VERIFIED.** The admin page's actual count/list logic, fresh admin authorization, member mutation implementation, committed database persistence and live public delivery were executed. Existing automated tests verify the form has exactly the two intended fields and that canceling the confirmation prevents submission.

## Checks executed

| Command/check | Result |
| --- | --- |
| Git working tree inspection | Completed before edits; unrelated work retained |
| Development log and existing server-process inspection | Confirmed missing-delegate TypeError and long-running development process |
| `node scripts/audit-db.mjs` | Connection PASS; member table and scalar columns present |
| `npx prisma migrate status --config prisma7.config.ts` | PASS; 12 migrations applied, no pending migration |
| Current generated-client inspection | Model type and runtime delegate present |
| `npx tsx scripts/test-operational-members-db.mjs` | PASS; rollback CRUD/image/version/confirmation checks, no committed fixture |
| `node --test tests/prisma-cache.test.mjs` | PASS; exact stale-singleton regression |
| `npx tsx scripts/verify-operational-members-persistence.mjs` | PASS; committed create/read/public/edit/replacement/delete checks described above |
| `npm run lint` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm test` | PASS; **57/57** |
| `npm run build` | PASS; production compile/type checks and 41 static-generation steps completed with 11 workers |

The user's existing development server was kept running; it was not killed, reset or replaced. No secret environment values or personal records were printed.
