import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadServerModule } from "./load-server-module.mjs";

const phones = loadServerModule("lib/employee-phone.ts");
const durations = loadServerModule("lib/employee-session-duration.ts");
const phone = "+94771234567";
const pin = "001234";
process.env.EMPLOYEE_PIN_PEPPER = "test-pepper-not-for-deployment-32-bytes";

test("employee cookies keep their absolute deadline while staff and cleared cookies are preserved", async () => {
  const { employeeCookieScope, withEmployeeCookieExpiry } = loadServerModule("lib/employee-session-cookie.ts");
  const now = Date.UTC(2026, 10, 23);
  const usualExpiry = new Date(now + 30 * 86_400_000).toUTCString();
  const headers = new Headers();
  headers.append("set-cookie", `__Secure-authjs.session-token=fake; Expires=${usualExpiry}; HttpOnly; Secure; SameSite=Lax`);
  headers.append("set-cookie", `__Secure-authjs.session-token.1=; Expires=${new Date(0).toUTCString()}; Max-Age=0`);
  headers.append("set-cookie", `__Secure-authjs.callback-url=fake; Expires=${usualExpiry}`);
  const results = await Promise.all([false, true, null].map(remember => withEmployeeCookieExpiry(async () => {
    if (remember !== null) employeeCookieScope.getStore().expires = durations.employeeSessionExpiry(remember, now);
    await Promise.resolve();
    return new Response(null, { headers });
  })));
  for (const [index, response] of results.entries()) {
    const cookies = response.headers.getSetCookie();
    const expected = [new Date(now + 12 * 3_600_000).toUTCString(), new Date(now + 90 * 86_400_000).toUTCString(), usualExpiry][index];
    assert.ok(cookies[0].includes(`Expires=${expected}`));
    assert.equal(cookies[1], headers.getSetCookie()[1]);
    assert.equal(cookies[2], headers.getSetCookie()[2]);
  }
});

function form(fields) {
  const result = new FormData();
  for (const [key, value] of Object.entries(fields)) result.set(key, value);
  return result;
}

function authActions(extra = {}) {
  return loadServerModule("app/actions/auth.ts", {
    "next-auth": { AuthError: class extends Error {} },
    "next/server": { after() {} },
    "next/navigation": { redirect: path => { throw new Error(path); } },
    "@/auth": {},
    "@/lib/employee-phone": phones,
    "@/lib/employee-pin": {},
    "@/lib/employee-phone-registration": {},
    "@/generated/prisma/client": { Prisma: { PrismaClientKnownRequestError: class extends Error {} } },
    "@/lib/notifications": {},
    "@/lib/prisma": {},
    ...extra,
  });
}

test("public auth exposes neither registration nor token enrollment", () => {
  const actions = authActions();
  assert.equal(actions.registerEmployee, undefined);
  assert.equal(actions.setupEmployeePin, undefined);
});

test("normalizes Sri Lankan phone variants and treats leading zeroes as PIN digits", () => {
  for (const variant of [phone, "077 123 4567", "0094-77-123-4567", "94771234567", "771234567"]) {
    assert.equal(phones.normalizeEmployeePhone(variant), phone);
  }
  for (const number of ["+1 771234567", "+940771234567", "077x1234567", "077123456", "--"]) assert.equal(phones.normalizeEmployeePhone(number), null);
  assert.equal(phones.isEmployeePin(pin), true);
  assert.equal(phones.isEmployeePin("12345"), false);
});

function pinHarness() {
  const buckets = new Map();
  const sessions = new Map();
  const user = { id: 7, role: "EMPLOYEE", status: "PENDING", employeeSessionVersion: 0, employeeProfile: { id: 20, fullName: "Test Employee" } };
  let credential;
  const assign = pinHash => { credential = { phone, pinHash, user }; };
  let ip = "192.0.2.1";
  const db = {
    $transaction: async callback => callback(db),
    $executeRaw: async (_sql, key, _one, expiresAt, now, maximum) => {
      if (!key) return;
      const previous = buckets.get(key);
      buckets.set(key, previous && previous.expiresAt > now
        ? { ...previous, attempts: Math.min(previous.attempts + 1, maximum) }
        : { attempts: 1, expiresAt });
    },
    employeeAuthThrottle: { findUnique: async ({ where }) => buckets.get(where.id) },
    user: {
      updateMany: async ({ where }) => {
        if (user.role !== where.role || user.status !== where.status) return { count: 0 };
        user.employeeSessionVersion++;
        return { count: 1 };
      },
      findUniqueOrThrow: async () => user,
    },
    employeeProfile: { update: async () => {} },
    employeePinCredential: {
      upsert: async ({ create }) => { credential = { ...create, user }; },
      findUnique: async ({ where }) => credential && (credential.phone === where.phone || credential.setupDigest === where.setupDigest && where.setupDigest) ? credential : null,
      updateMany: async ({ where, data }) => {
        if (credential.setupDigest !== where.setupDigest || credential.setupUntil <= where.setupUntil.gt ||
          user.status !== where.user.status || user.role !== where.user.role || user.employeeSessionVersion !== where.user.employeeSessionVersion) return { count: 0 };
        Object.assign(credential, data);
        return { count: 1 };
      },
    },
    employeePinSession: {
      create: async ({ data }) => sessions.set(data.id, data),
      deleteMany: async ({ where }) => {
        for (const [id, session] of sessions) if (id === where.id || session.userId === where.userId) sessions.delete(id);
      },
      findUnique: async ({ where }) => {
        const session = sessions.get(where.id);
        return session && session.userId === where.userId && session.expiresAt > where.expiresAt.gt &&
          user.role === where.user.role && user.status === where.user.status ? { ...session, user } : null;
      },
    },
  };
  const pinAuth = loadServerModule("lib/employee-pin.ts", {
    "next/headers": { headers: async () => new Headers({ "x-real-ip": ip }) },
    "@/lib/employee-phone": phones,
    "@/lib/employee-session-duration": loadServerModule("lib/employee-session-duration.ts"),
    "@/lib/prisma": { prisma: db },
    "@/lib/employee-phone-registration": { assertEmployeePhonesAvailable: async () => {}, employeePhoneTransaction: run => run(db) },
  });
  return { ...pinAuth, assign, user, sessions, buckets, changeIp: value => { ip = value; }, credential: () => credential };
}

test("assigned six-digit codes use Argon2id and preserve leading zeroes", async () => {
  const auth = pinHarness();
  const hashed = await auth.hashEmployeeCode(pin);
  assert.match(hashed, /^\$argon2id\$/);
  assert.notEqual(hashed, pin);
  assert.throws(() => auth.hashEmployeeCode("12345"), /Invalid/);
});

test("PIN login handles invalid PINs, device duration, logout, disable/reactivate and role isolation", async () => {
  const auth = pinHarness();
  auth.user.status = "APPROVED";
  auth.assign(await auth.hashEmployeeCode(pin));
  assert.equal(await auth.authenticateEmployee(phone, "123456", true), null);
  const short = await auth.authenticateEmployee(phone, pin, false);
  const remembered = await auth.authenticateEmployee("0771234567", pin, true);
  assert.ok(short && remembered);
  const lifetimes = [...auth.sessions.values()].map(row => row.expiresAt.getTime() - Date.now());
  assert.ok(lifetimes[0] > 11 * 3600000 && lifetimes[0] <= 12 * 3600000);
  assert.ok(lifetimes[1] > 89 * 86400000 && lifetimes[1] <= 90 * 86400000);
  assert.ok(await auth.getEmployeeSessionExpiry(remembered.employeeSession, 7));
  assert.equal(await auth.getEmployeeSessionExpiry(remembered.employeeSession, 9), null);
  const shortRow = [...auth.sessions.values()][0];
  const shortExpiry = shortRow.expiresAt;
  shortRow.expiresAt = new Date(0);
  assert.equal(await auth.getEmployeeSessionExpiry(short.employeeSession, 7), null);
  shortRow.expiresAt = shortExpiry;
  await auth.revokeEmployeeSession(short.employeeSession);
  assert.equal(await auth.getEmployeeSessionExpiry(short.employeeSession, 7), null);
  auth.user.status = "DISABLED";
  auth.user.employeeSessionVersion++;
  assert.equal(await auth.getEmployeeSessionExpiry(remembered.employeeSession, 7), null);
  assert.equal(await auth.authenticateEmployee(phone, pin, true), null);
  auth.user.status = "APPROVED";
  assert.equal(await auth.getEmployeeSessionExpiry(remembered.employeeSession, 7), null);
  auth.user.role = "SUPERVISOR";
  assert.equal(await auth.authenticateEmployee(phone, pin, true), null);
});

test("account lockout spans IP addresses, IP limits span accounts, and expired counters reset", async () => {
  const auth = pinHarness();
  for (let attempt = 0; attempt < 5; attempt++) {
    auth.changeIp("192.0.2." + (attempt + 1));
    assert.equal(await auth.allowEmployeeAuthAttempt("login", phone), true);
  }
  auth.changeIp("192.0.2.8");
  assert.equal(await auth.allowEmployeeAuthAttempt("login", phone), false);
  for (const bucket of auth.buckets.values()) bucket.expiresAt = new Date(0);
  assert.equal(await auth.allowEmployeeAuthAttempt("login", phone), true);
  auth.changeIp("192.0.2.10");
  for (let attempt = 0; attempt < 30; attempt++) {
    assert.equal(await auth.allowEmployeeAuthAttempt("login", "+94771" + String(attempt).padStart(6, "0")), true);
  }
  assert.equal(await auth.allowEmployeeAuthAttempt("login", "+94770000001"), false);
});

test("admin-created employees get a hashed code and deactivation revokes sessions", async () => {
  let authorized = false, created, revoked;
  const credential = pinHarness();
  const db = { user: {
    create: async ({ data }) => { created = data; },
    findUnique: async () => ({ role: "EMPLOYEE", status: "APPROVED" }),
    updateMany: async ({ data }) => {
      assert.deepEqual(data.employeeSessionVersion, { increment: 1 });
      assert.equal(data.status, "DISABLED");
      return { count: 1 };
    },
  }, employeePinSession: { deleteMany: async ({ where }) => { revoked = where.userId; } } };
  const action = loadServerModule("app/admin/(protected)/employees/actions.ts", {
    "next/cache": { revalidatePath() {} },
    "next/navigation": { redirect: path => { throw new Error(path); } },
    "@/generated/prisma/client": { Prisma: { PrismaClientKnownRequestError: class extends Error {} } },
    "@/lib/permissions": { requireAdmin: async () => {
      if (!authorized) throw new Error("ADMIN_REQUIRED");
      return { user: { id: "1" } };
    } },
    "@/lib/employee-phone": phones,
    "@/lib/employee-pin": { hashEmployeeCode: credential.hashEmployeeCode, clearEmployeeLoginThrottle: async () => {} },
    "@/lib/prisma": { prisma: db },
    "@/lib/employee-phone-registration": { assertEmployeePhonesAvailable: async (_tx, values) => assert.deepEqual(values, [phone]), employeePhoneTransaction: run => run(db) },
  });
  const data = form({ fullName: "Test Employee", phone: "077 123 4567", position: "Coordinator", code: pin, role: "ADMIN" });
  await assert.rejects(action.saveEmployee(null, {}, data), /ADMIN_REQUIRED/);
  authorized = true;
  await assert.rejects(action.saveEmployee(null, {}, data), /admin\/employees/);
  assert.equal(created.role, "EMPLOYEE");
  assert.equal(created.status, "APPROVED");
  assert.equal(created.employeeProfile.create.phone, phone);
  assert.match(created.employeePin.create.pinHash, /^\$argon2id\$/);
  assert.equal(created.employeePin.create.setupDigest, null);
  assert.ok((await action.updateEmployeeStatus(7, "disable", {}, new FormData())).success);
  assert.equal(revoked, 7);
  assert.equal(action.issueEmployeePinSetup, undefined);
});

test("admin create form contains only profile details and a masked code", () => {
  const { AdminEmployeeForm } = loadServerModule("components/admin/employee-form.tsx", {
    "@/components/use-form-submission": { useFormSubmission: () => ({ showFeedback: true }) },
    react: { ...React, useActionState: () => [{}, () => {}, false] },
    "@/components/public-language": { T: ({ text }) => text },
  });
  const html = renderToStaticMarkup(React.createElement(AdminEmployeeForm));
  assert.deepEqual([...html.matchAll(/<input[^>]*name="([^"]+)"/g)].map(match => match[1]), ["fullName", "phone", "position", "code"]);
  assert.match(html, /type="password"/);
});
