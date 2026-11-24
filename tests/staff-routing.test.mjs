import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { loadServerModule } from "./load-server-module.mjs";

const phoneTools = loadServerModule("lib/employee-phone.ts");
const matrix = { ADMIN: "/admin", EMPLOYEE: "/employee", SUPERVISOR: "/supervisor" };

test("public registration and login-code enrollment routes have been removed", () => {
  for (const path of ["register", "register/success", "pin-setup", "pin-reset"]) {
    assert.equal(existsSync(`app/(public)/employee-access/${path}/page.tsx`), false);
  }
});

test("successful credentials actions use role-specific landing pages and ignore submitted redirects", async () => {
  const calls = [];
  const { login, adminLogin, employeeLogin } = loadServerModule("app/actions/auth.ts", {
    "next-auth": { AuthError: class extends Error {} },
    "@/auth": { signIn: async (_provider, options) => { calls.push(options); } },
    "@/lib/employee-phone": phoneTools,
    "@/lib/employee-pin": {},
    "@/lib/employee-phone-registration": {},
    "@/generated/prisma/client": {},
    "@/lib/prisma": {},
    "@/lib/notifications": {},
    "@/lib/rate-limit": {},
  });
  const form = new FormData();
  form.set("identifier", "JWS-12");
  form.set("email", "admin@example.invalid");
  form.set("password", "Test password");
  form.set("role", "ADMIN");
  form.set("redirectTo", "/admin");
  await login({}, form);
  await adminLogin({}, form);
  form.set("phone", "0771234567");
  form.set("pin", "001234");
  await employeeLogin({}, form);
  assert.deepEqual(calls.map(({ portal, redirectTo }) => [portal, redirectTo]), [
    ["staff", "/supervisor-login"],
    ["admin", "/admin/login"],
    ["employee", "/employee"],
  ]);
});

for (const [role, destination] of Object.entries(matrix)) {
  test(`login redirects follow the current ${role} role only at its own entry point`, async () => {
    const account = { role, status: "APPROVED" };
    const { redirectAuthenticatedUser } = loadServerModule("lib/permissions.ts", {
      "@/auth": { auth: async () => ({ user: { id: "7", role } }) },
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
  await assert.rejects(requireAdmin(), { message: "/admin/login" });
  await assert.rejects(requireEmployee(), { message: "/employee-access/login" });
});

test("credentials only authenticate the requested portal's approved roles", async () => {
  let config;
  const accounts = [
    { id: 1, role: "ADMIN", status: "APPROVED", email: "admin@example.invalid" },
    { id: 2, role: "EMPLOYEE", status: "APPROVED", email: "staff@example.invalid", employeeProfile: { id: 12, employeeCode: "JWS-12" } },
    { id: 3, role: "EMPLOYEE", status: "PENDING", email: "pending@example.invalid" },
    { id: 4, role: "SUPERVISOR", status: "APPROVED", email: "supervisor@example.invalid" },
  ];
  loadServerModule("auth.ts", {
    "next-auth": settings => { config = settings; return {}; },
    "next-auth/providers/credentials": provider => provider,
    "next-auth/jwt": {},
    "@/lib/employee-session-cookie": {},
    "bcryptjs": { compare: async (input, stored) => input === stored },
    "@/lib/rate-limit": { consumeRateLimit: async () => ({ allowed: true }) },
    "@/lib/employee-pin": { authenticateEmployee: async (phone, pin) => phone === "0771234567" && pin === "001234" ? accounts[1] : null },
    "@/lib/prisma": { prisma: { user: { findFirst: async ({ where, select }) => {
      assert.deepEqual(select, {
        id: true,
        email: true,
        role: true,
        status: true,
        passwordHash: true,
        employeeProfile: { select: { id: true, fullName: true } },
      });
      const roles = typeof where.role === "string" ? [where.role] : where.role.in;
      const account = accounts.find(row => roles.includes(row.role) && where.OR.some(condition =>
        condition.email !== undefined ? condition.email === row.email :
          condition.employeeProfile.is.employeeCode === row.employeeProfile?.employeeCode,
      ));
      return account && { ...account, passwordHash: " Test password " };
    } } } },
  });
  const authorize = config.providers[0].authorize;
  const attempt = (identifier, portal) => authorize({ identifier, portal, password: " Test password " });
  assert.equal(await attempt("JWS-12", "staff"), null);
  assert.equal(await attempt("STAFF@example.invalid", "staff"), null);
  assert.equal((await authorize({ portal: "employee", phone: "0771234567", pin: "001234" })).role, "EMPLOYEE");
  assert.equal(await authorize({ portal: "admin", phone: "0771234567", pin: "001234" }), null);
  assert.equal(await authorize({ portal: "staff", phone: "0771234567", pin: "001234" }), null);
  assert.equal((await attempt("supervisor@example.invalid", "staff")).role, "SUPERVISOR");
  assert.equal((await attempt("admin@example.invalid", "admin")).role, "ADMIN");
  assert.equal(await attempt("staff@example.invalid", "admin"), null);
  assert.equal(await attempt("JWS-12", "admin"), null);
  assert.equal(await attempt("admin@example.invalid", "staff"), null);
  assert.equal(await attempt("pending@example.invalid", "staff"), null);
  const baseUrl = "https://jws.example";
  assert.equal(config.callbacks.redirect({ url: "/admin/employees", baseUrl }), baseUrl + "/employee-access");
  assert.equal(config.callbacks.redirect({ url: "https://external.example/admin", baseUrl }), baseUrl);
  assert.equal(config.callbacks.redirect({ url: "/admin/login", baseUrl }), baseUrl + "/admin/login");
  const protectedRequest = pathname => ({ request: { nextUrl: new URL(pathname, baseUrl) } });
  assert.equal(config.callbacks.authorized(protectedRequest("/admin/employees")).headers.get("location"), baseUrl + "/admin/login");
  assert.equal(config.callbacks.authorized(protectedRequest("/supervisor")).headers.get("location"), baseUrl + "/supervisor-login");
});
