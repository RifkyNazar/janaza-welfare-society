// Run against a local application connected to a fresh, migrated disposable database.
import assert from "node:assert/strict";
import { randomBytes, randomInt } from "node:crypto";
import { hash } from "bcryptjs";
import mariadb from "mariadb";

const database = new URL(process.env.DATABASE_URL);
const base = new URL(process.env.JWS_QA_BASE_URL);
const loopback = hostname => ["localhost", "127.0.0.1"].includes(hostname);
assert.ok(loopback(database.hostname) && loopback(base.hostname));
assert.match(database.pathname, /^\/jws_(?:qa|employee_test)_[a-z0-9_]+$/);
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

const createPath = "/admin/employees/new";
const phone = "077" + String(randomInt(1_000_000, 10_000_000));
const normalized = "+94" + phone.slice(1);
const pin = "001234";
const replacement = "004321";
const profile = { fullName: "Integration test employee", phone, position: "Coordinator" };
const submitEmployee = (http, number) => http.submit(createPath, 'name="code"', { ...profile, phone: number, code: pin });
const loginEmployee = (http, code) => http.submit("/employee-access/login", 'name="pin"', { phone, pin: code });
const identifier = randomBytes(8).toString("hex");
const email = `employee-db-test-${identifier}@example.invalid`;
const supervisorEmail = `supervisor-db-test-${identifier}@example.invalid`;

try {
  const password = randomBytes(24).toString("hex");
  const passwordHash = await hash(password, 10);
  await db.query("INSERT INTO User (email,passwordHash,role,status,updatedAt) VALUES (?,?,'ADMIN','APPROVED',NOW(3)),(?,?,'SUPERVISOR','APPROVED',NOW(3))", [email, passwordHash, supervisorEmail, passwordHash]);
  const admin = client(), otherAdmin = client(), supervisor = client(), employee = client();
  for (const session of [admin, otherAdmin]) {
    assert.equal((await session.submit("/admin/login", 'name="password"', { email, password })).code, 303);
    assert.equal((await session.request("/admin")).code, 200);
  }
  assert.equal((await supervisor.submit("/supervisor-login", 'name="password"', { identifier: supervisorEmail, password })).code, 303);
  assert.equal((await supervisor.request("/supervisor")).code, 200);
  assert.equal((await supervisor.request(createPath)).path, "/supervisor");
  assert.equal((await client().request(createPath)).path, "/admin/login");
  for (const path of ["register", "register/success", "pin-setup", "pin-reset"]) {
    assert.equal((await client().request("/employee-access/" + path)).code, 404);
  }
  console.log("PASS staff authentication, Admin-only creation and removed public workflow routes");

  const results = await Promise.all([submitEmployee(admin, phone), submitEmployee(otherAdmin, normalized)]);
  assert.equal(results.filter(result => result.path === "/admin/employees").length, 1);
  assert.match(results.find(result => result.code === 200).html, /already in use/);
  const employees = await db.query("SELECT p.userId,c.pinHash,c.setupDigest FROM EmployeeProfile p JOIN EmployeePinCredential c ON c.userId=p.userId WHERE p.phone=?", [normalized]);
  assert.equal(employees.length, 1);
  const { userId, pinHash, setupDigest } = employees[0];
  assert.match(pinHash, /^\$argon2id\$/);
  assert.notEqual(pinHash, pin);
  assert.equal(setupDigest, null);
  console.log("PASS simultaneous submissions with equivalent phones commit one Argon2id credential");

  assert.equal((await loginEmployee(employee, pin)).path, "/employee");
  assert.equal((await employee.request("/employee")).code, 200);
  assert.equal((await employee.request(createPath)).path, "/employee");
  const edit = await admin.submit("/admin/employees/" + userId, 'name="code"', { ...profile, code: replacement });
  assert.match(edit.html, /Employee saved/);
  assert.equal((await employee.request("/employee")).path, "/employee-access/login");
  const [count] = await db.query("SELECT COUNT(*) AS n FROM EmployeePinSession WHERE userId=?", [userId]);
  assert.equal(Number(count.n), 0);
  assert.match((await loginEmployee(client(), pin)).html, /Unable to sign in/);
  assert.equal((await loginEmployee(client(), replacement)).path, "/employee");
  console.log("PASS phone/code login, reset rejects prior code and revokes prior sessions");
} finally {
  await db.end();
}
