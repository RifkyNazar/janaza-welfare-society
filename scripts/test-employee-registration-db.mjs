// Run against a local application connected to a fresh, migrated disposable database.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import mariadb from "mariadb";

const database = new URL(process.env.DATABASE_URL);
const base = new URL(process.env.JWS_QA_BASE_URL);
const loopback = hostname => ["localhost", "127.0.0.1"].includes(hostname);
assert.ok(loopback(database.hostname) && loopback(base.hostname));
assert.match(database.pathname, /^\/jws_registration_test_[a-z0-9_]+$/);
const db = await mariadb.createConnection({
  host: database.hostname, port: Number(database.port || 3306),
  user: decodeURIComponent(database.username), password: decodeURIComponent(database.password),
  database: database.pathname.slice(1),
});

function client() {
  const cookies = new Map();
  async function request(path, body) {
    const response = await fetch(new URL(path, base), {
      method: body ? "POST" : "GET",
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: { connection: "close", cookie: [...cookies].map(pair => pair.join("=")).join("; "), ...(body && { origin: base.origin }) },
    }).catch(cause => { throw new Error(`Unable to ${body ? "POST" : "GET"} ${path}`, { cause }); });
    for (const header of response.headers.getSetCookie()) {
      const [pair] = header.split(";");
      const [key, value] = pair.split("=", 2);
      if (value) cookies.set(key, value);
      else cookies.delete(key);
    }
    const location = response.headers.get("location");
    const html = await response.text().catch(cause => { throw new Error(`Unable to read the response for ${path}`, { cause }); });
    return { code: response.status, path: location && new URL(location, base).pathname, html };
  }
  async function submit(path, match, fields) {
    const page = await request(path);
    assert.equal(page.code, 200);
    const form = [...page.html.matchAll(/<form[^>]*>[\s\S]*?<\/form>/g)].find(([tag]) => tag.includes(match));
    assert.ok(form);
    const body = new FormData();
    const decode = value => value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
    for (const [tag] of form[0].matchAll(/<input[^>]*>/g)) {
      const name = tag.match(/ name="([^"]*)"/)?.[1];
      if (name?.startsWith("$ACTION_")) body.append(name, decode(tag.match(/ value="([^"]*)"/)?.[1] ?? ""));
    }
    for (const [name, value] of Object.entries(fields)) body.set(name, value);
    return request(path, body);
  }
  return { request, submit };
}

const registerPath = "/employee-access/register";
const reportPath = "/admin/employees/phone-conflicts";
const duplicateError = "Unable to register with this phone number. Check the number or contact JWS for help.";
const register = (http, phone) => http.submit(registerPath, 'name="fullName"', { fullName: "Registration test", phone, position: "Volunteer" });
const count = async phone => Number((await db.query("SELECT COUNT(*) AS n FROM EmployeeProfile WHERE phone=?", [phone]))[0].n);
function duplicate(result) {
  assert.equal(result.code, 200);
  assert.ok(result.html.includes(duplicateError));
}

try {
  assert.equal(Number((await db.query("SELECT COUNT(*) AS n FROM User"))[0].n), 0, "Use a fresh disposable database");
  const password = randomBytes(24).toString("hex");
  const passwordHash = await hash(password, 10);
  for (const [role, email] of [["ADMIN", "admin@example.invalid"], ["SUPERVISOR", "supervisor@example.invalid"]]) {
    await db.query("INSERT INTO User (email,passwordHash,role,status,updatedAt) VALUES (?,?,?,'APPROVED',NOW())", [email, passwordHash, role]);
  }
  const admin = client(), supervisor = client();
  assert.equal((await admin.submit("/admin/login", 'name="password"', { email: "admin@example.invalid", password })).code, 303);
  assert.equal((await admin.request("/admin/login")).path, "/admin");
  assert.equal((await admin.request("/admin")).code, 200);
  assert.equal((await supervisor.submit("/supervisor-login", 'name="password"', { identifier: "supervisor@example.invalid", password })).code, 303);
  assert.equal((await supervisor.request("/supervisor-login")).path, "/supervisor");
  assert.equal((await supervisor.request("/supervisor")).code, 200);
  assert.equal((await supervisor.request(reportPath)).path, "/supervisor");
  assert.equal((await client().request(reportPath)).path, "/admin/login");
  console.log("PASS Admin and Supervisor sign-in, dashboards and report authorization");

  assert.equal((await register(client(), "0778400121")).path, registerPath + "/success");
  duplicate(await register(client(), "+94 77 840 0121"));
  assert.equal(await count("+94778400121"), 1);
  const [pending] = await db.query("SELECT userId FROM EmployeeProfile WHERE phone='+94778400121'");
  await admin.submit("/admin/employees/" + pending.userId, ">Approve<", {});
  assert.equal((await db.query("SELECT status FROM User WHERE id=?", [pending.userId]))[0].status, "APPROVED");
  duplicate(await register(client(), "(077) 840-0121"));
  assert.equal(await count("+94778400121"), 1);
  console.log("PASS equivalent phone formats against pending and approved registrations");

  const race = await Promise.all([register(client(), "0778400122"), register(client(), "+94778400122")]);
  assert.equal(race.filter(result => result.path === registerPath + "/success").length, 1);
  duplicate(race.find(result => result.path !== registerPath + "/success"));
  assert.equal(await count("+94778400122"), 1);
  console.log("PASS concurrent HTTP submissions committed one account");

  const insertLegacy = async (email, status, rawPhone) => {
    const user = await db.query("INSERT INTO User (email,passwordHash,role,status,updatedAt) VALUES (?,'!','EMPLOYEE',?,NOW())", [email, status]);
    await db.query("INSERT INTO EmployeeProfile (userId,employeeCode,fullName,phone,position,updatedAt) VALUES (?,?,?,?,?,NOW())",
      [user.insertId, email, "Legacy employee", rawPhone, "Volunteer"]);
    return Number(user.insertId);
  };
  const legacyPending = await insertLegacy("legacy-pending@example.invalid", "PENDING", "077 840 0123");
  const legacyApproved = await insertLegacy("legacy-approved@example.invalid", "APPROVED", "+94778400123");
  const report = await admin.request(reportPath);
  assert.equal(report.code, 200);
  for (const userId of [legacyPending, legacyApproved]) assert.ok(report.html.includes('/admin/employees/' + userId + '"'));
  assert.ok(report.html.includes("077 840 0123"));
  const blockedApproval = await admin.submit("/admin/employees/" + legacyPending, ">Approve<", {});
  assert.ok(blockedApproval.html.includes("Review the duplicate phone report"));
  assert.equal((await db.query("SELECT status FROM User WHERE id=?", [legacyPending]))[0].status, "PENDING");
  assert.equal(await count("077 840 0123"), 1);
  assert.equal(await count("+94778400123"), 1);
  console.log("PASS legacy duplicate discovery, blocked approval and preservation of both phone values");
} finally {
  await db.end();
}
