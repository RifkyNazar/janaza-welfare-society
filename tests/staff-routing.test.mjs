import assert from "node:assert/strict";
import test from "node:test";
import { loadServerModule } from "./load-server-module.mjs";

const matrix = { ADMIN: "/admin", EMPLOYEE: "/employee", SUPERVISOR: "/supervisor" };

for (const [role, destination] of Object.entries(matrix)) {
  test(`login redirects follow the current ${role} role only at its own entry point`, async () => {
    const account = { role, status: "APPROVED" };
    const { redirectAuthenticatedUser } = loadServerModule("lib/permissions.ts", {
      "@/auth": { auth: async () => ({ user: { id: "7", role: "ADMIN" } }) },
      "@/lib/prisma": { prisma: { user: { findUnique: async () => account } } },
      "next/navigation": { redirect: path => { throw new Error(path); } },
    });
    await assert.rejects(redirectAuthenticatedUser([role]), { message: destination });
    await redirectAuthenticatedUser(Object.keys(matrix).filter(other => other !== role));
  });
}

test("an employee cannot use an admin JWT claim to pass the admin guard", async () => {
  const { requireAdmin, requireEmployee } = loadServerModule("lib/permissions.ts", {
    "@/auth": { auth: async () => ({ user: { id: "7", role: "ADMIN", status: "APPROVED" } }) },
    "@/lib/prisma": { prisma: { user: { findUnique: async () => ({
      role: "EMPLOYEE", status: "APPROVED", employeeProfile: { id: 12 },
    }) } } },
    "next/navigation": { redirect: path => { throw new Error(path); } },
  });
  await assert.rejects(requireAdmin(), { message: "/employee" });
  assert.equal((await requireEmployee()).user.role, "EMPLOYEE");
});
