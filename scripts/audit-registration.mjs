import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { hash } from "bcryptjs";
import { decode } from "next-auth/jwt";
import { loadServerModule } from "../tests/load-server-module.mjs";

const redirect = path => { throw new Error(path); };
const day = 86_400_000;
const cookieExpiry = response => {
  const cookie = response.headers.getSetCookie().find(value => value.startsWith("__Secure-authjs.session-token="));
  return Date.parse(/; Expires=([^;]+)/i.exec(cookie ?? "")?.[1] ?? "");
};
const form = fields => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  const database = new URL(process.env.DATABASE_URL);
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(database.hostname) && /^\/jws_pin_qa_[a-z0-9_]+$/.test(database.pathname),
    "Use a migrated disposable local database named jws_pin_qa_*.");
  const origin = new URL(process.env.JWS_AUTH_QA_ORIGIN ?? "http://127.0.0.1:3103");
  assert.equal(origin.hostname, "127.0.0.1");
  const { prisma } = await import("../lib/prisma.ts");
  const { Prisma } = await import("../generated/prisma/client.ts");
  const phones = loadServerModule("lib/employee-phone.ts");
  const identifiers = { "@/lib/prisma": { prisma }, "@/lib/employee-phone": phones, "@/generated/prisma/client": { Prisma } };
  const registration = loadServerModule("lib/employee-phone-registration.ts", identifiers);
  const phoneModules = { ...identifiers, "@/lib/employee-phone-registration": registration };
  const pinAuth = loadServerModule("lib/employee-pin.ts", {
    ...phoneModules,
    "@/lib/employee-session-duration": loadServerModule("lib/employee-session-duration.ts"),
    "next/headers": { headers: async () => new Headers({ "x-real-ip": "192.0.2.30" }) },
  });
  const pinModules = { ...phoneModules, "@/lib/employee-pin": pinAuth };
  const accountIds = [];
  try {
    const phone = "+9477" + String(randomInt(10_000_000)).padStart(7, "0");
    const pin = "001234";
    const nonce = randomUUID();
    const staffPassword = "QA only staff password";
    const passwordHash = await hash(staffPassword, 10);
    const staff = {};
    for (const role of ["ADMIN", "SUPERVISOR"]) {
      const account = await prisma.user.create({
        data: { email: role.toLowerCase() + "-" + nonce + "@example.invalid", passwordHash, role, status: "APPROVED" },
        select: { id: true, email: true },
      });
      accountIds.push(account.id);
      staff[role] = account;
    }
    const admin = staff.ADMIN;
    const authActions = loadServerModule("app/actions/auth.ts", {
      ...pinModules,
      "next-auth": { AuthError: class extends Error {} },
      "next/server": { after() {} },
      "next/navigation": { redirect },
      "@/auth": {},
      "@/lib/notifications": {},
    });
    const adminActions = loadServerModule("app/admin/(protected)/employees/actions.ts", {
      ...pinModules,
      "next/cache": { revalidatePath() {} },
      "@/lib/permissions": { requireAdmin: async () => ({ user: { id: String(admin.id) } }) },
    });

    const name = "PIN QA " + nonce;
    await assert.rejects(authActions.registerEmployee({}, form({ fullName: name, phone, position: "QA", role: "ADMIN" })),
      { message: "/employee-access/register/success" });
    const localPhone = "0" + phone.slice(3);
    const duplicate = await authActions.registerEmployee({}, form({ fullName: name + " duplicate", phone: localPhone, position: "QA" }));
    assert.match(duplicate.error, /Unable to register with this phone number/);
    const employees = await prisma.user.findMany({
      where: { employeeProfile: { fullName: { startsWith: name } } },
      select: { id: true, status: true, role: true },
    });
    accountIds.push(...employees.map(account => account.id));
    assert.equal(employees.length, 1);
    assert.ok(employees.every(account => account.role === "EMPLOYEE" && account.status === "PENDING"));
    const [employee] = employees;
    const verified = form({ phone, identityVerified: "on" });
    assert.ok((await adminActions.issueEmployeePinSetup(employee.id, {}, verified)).error);
    assert.ok((await adminActions.updateEmployeeStatus(employee.id, "approve", {}, new FormData())).success);
    const issued = await adminActions.issueEmployeePinSetup(employee.id, {}, verified);
    assert.ok(typeof issued.token === "string" && issued.token.length === 43);
    const results = await Promise.all([pinAuth.enrollEmployeePin(phone, issued.token, pin), pinAuth.enrollEmployeePin(phone, issued.token, pin)]);
    assert.deepEqual(results.sort(), [false, true]);
    console.log("Database registration, approval, duplicate-phone protection and single-use Argon2id enrollment passed.");

    function browser(cookies = new Map()) {
      const send = async (path, body) => {
        const headers = { cookie: [...cookies].map(pair => pair.join("=")).join("; "), "x-real-ip": "192.0.2.31" };
        if (body) Object.assign(headers, { origin: origin.origin, "content-type": "application/x-www-form-urlencoded" });
        const response = await fetch(new URL(path, origin), { method: body ? "POST" : "GET", headers, body, redirect: "manual" });
        for (const cookie of response.headers.getSetCookie()) {
          const pair = cookie.split(";")[0];
          const delimiter = pair.indexOf("=");
          const name = pair.slice(0, delimiter);
          const value = pair.slice(delimiter + 1);
          if (value) cookies.set(name, value);
          else cookies.delete(name);
        }
        return response;
      };
      const post = async (path, fields) => {
        const csrfToken = (await (await send("/api/auth/csrf")).json()).csrfToken;
        return send(path, new URLSearchParams({ csrfToken, ...fields }));
      };
      return { send, post, copy: () => browser(new Map(cookies)) };
    }
    const employeeBrowser = browser();
    const credentials = { portal: "employee", phone, pin, remember: "on", callbackUrl: "/employee" };
    await employeeBrowser.post("/api/auth/callback/credentials", { ...credentials, pin: "123456" });
    assert.equal(await (await employeeBrowser.send("/api/auth/session")).json(), null);
    const signIn = await employeeBrowser.post("/api/auth/callback/credentials", credentials);
    const cookie = signIn.headers.getSetCookie().find(value => value.startsWith("__Secure-authjs.session-token="));
    assert.ok(/HttpOnly/i.test(cookie ?? ""), "Employee session cookie must be HttpOnly.");
    assert.ok(/; Secure/i.test(cookie ?? ""), "Employee session cookie must be Secure.");
    assert.ok(/SameSite=Lax/i.test(cookie ?? ""), "Employee session cookie must be SameSite=Lax.");
    const [rememberedSession] = await prisma.employeePinSession.findMany({ where: { userId: employee.id } });
    const expiry = rememberedSession.expiresAt.getTime();
    assert.ok(expiry > Date.now() + 89 * day && expiry <= Date.now() + 90 * day);
    assert.equal(cookieExpiry(signIn), expiry);
    const cookieName = "__Secure-authjs.session-token";
    const encoded = cookie.slice(cookieName.length + 1).split(";", 1)[0];
    const jwt = await decode({ token: encoded, salt: cookieName, secret: process.env.AUTH_SECRET });
    assert.ok(jwt?.exp && jwt.exp * 1000 <= expiry && jwt.exp * 1000 >= expiry - 1000, "The JWT must expire by the database deadline.");
    const refreshed = await employeeBrowser.send("/api/auth/session");
    assert.equal(cookieExpiry(refreshed), expiry);
    assert.equal(Date.parse((await refreshed.json()).expires), expiry);
    const employeePage = await employeeBrowser.send("/employee");
    assert.equal(employeePage.status, 200);
    assert.equal(cookieExpiry(employeePage), expiry);
    assert.equal((await employeeBrowser.send("/admin")).status, 307);
    assert.equal((await employeeBrowser.send("/supervisor")).status, 307);
    const replay = employeeBrowser.copy();
    await employeeBrowser.post("/api/auth/signout", { callbackUrl: "/employee-access/login" });
    assert.equal(await (await replay.send("/api/auth/session")).json(), null);

    const normalSignIn = await employeeBrowser.post("/api/auth/callback/credentials", { ...credentials, remember: "off" });
    const [normalSession] = await prisma.employeePinSession.findMany({ where: { userId: employee.id } });
    const normalExpiry = normalSession.expiresAt.getTime();
    assert.ok(normalExpiry > Date.now() + 11 * 3_600_000 && normalExpiry <= Date.now() + 12 * 3_600_000);
    assert.equal(cookieExpiry(normalSignIn), normalExpiry);
    assert.equal((await employeeBrowser.send("/employee")).status, 200);
    assert.ok((await adminActions.updateEmployeeStatus(employee.id, "disable", {}, new FormData())).success);
    assert.equal(await (await employeeBrowser.send("/api/auth/session")).json(), null);
    assert.ok((await adminActions.updateEmployeeStatus(employee.id, "reactivate", {}, new FormData())).success);
    assert.equal(await (await employeeBrowser.send("/api/auth/session")).json(), null);
    for (let attempt = 0; attempt < 2; attempt++) {
      await employeeBrowser.post("/api/auth/callback/credentials", { ...credentials, pin: "123456" });
    }
    await employeeBrowser.post("/api/auth/callback/credentials", credentials);
    assert.equal(await (await employeeBrowser.send("/api/auth/session")).json(), null, "The sixth attempt must be locked out.");

    const adminBrowser = browser();
    const adminSignIn = await adminBrowser.post("/api/auth/callback/credentials", { portal: "admin", identifier: admin.email, password: staffPassword, callbackUrl: "/admin/login" });
    assert.ok(Math.abs(cookieExpiry(adminSignIn) - Date.now() - 30 * day) < 5000);
    assert.equal((await adminBrowser.send("/admin")).status, 200);
    for (const path of ["/employee-access", "/employee-access/register", "/employee-access/register/success"]) {
      assert.equal((await adminBrowser.send(path)).status, 200);
    }
    const supervisorBrowser = browser();
    const supervisorSignIn = await supervisorBrowser.post("/api/auth/callback/credentials", { portal: "staff", identifier: staff.SUPERVISOR.email, password: staffPassword, callbackUrl: "/supervisor-login" });
    assert.ok(Math.abs(cookieExpiry(supervisorSignIn) - Date.now() - 30 * day) < 5000);
    assert.equal((await supervisorBrowser.send("/supervisor")).status, 200);
    console.log("Production-mode Auth.js sign-in, secure cookie, lockout, role isolation, logout replay, admin disable and registration routing passed.");
  } finally {
    await prisma.employeeProfile.deleteMany({ where: { userId: { in: accountIds } } });
    await prisma.user.deleteMany({ where: { id: { in: accountIds } } });
    await prisma.$disconnect();
  }
}

main().catch(error => {
  const location = error.stack?.split("\n").find(line => line.includes("at main ("));
  console.error("Employee PIN audit failed:", error.code ?? error.name, location ?? "");
  process.exitCode = 1;
});
