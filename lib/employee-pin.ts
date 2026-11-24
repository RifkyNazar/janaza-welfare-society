import "server-only";
import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isEmployeePin, normalizeEmployeePhone } from "@/lib/employee-phone";
import { employeeSessionExpiry } from "@/lib/employee-session-duration";

const minute = 60_000;
const pinOptions = { memoryCost: 19_456, timeCost: 2, parallelism: 1 }; // The library defaults to Argon2id.
const dummyHash = "$argon2id$v=19$m=19456,t=2,p=1$MDAwMDAwMDAwMDAwMDAwMA$U04PdL0T1wXWNjg5FWpnGbD0myRktdG7G0k/Mr7xdGQ";

function pepper() {
  const key = process.env.EMPLOYEE_PIN_PEPPER;
  if (!key || Buffer.byteLength(key) < 32) throw new Error("Employee PIN authentication requires a configured pepper.");
  return key;
}

function keyedDigest(scope: string, value: string) {
  return createHmac("sha256", pepper()).update(scope).update("\0").update(value).digest("hex");
}

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const newSecret = () => randomBytes(32).toString("base64url");

async function consume(scope: string, subject: string, limit: number, period: number) {
  const id = keyedDigest(scope, subject);
  const now = new Date();
  const expires = new Date(now.getTime() + period);
  await prisma.$executeRaw`
    INSERT INTO EmployeeAuthThrottle (id, attempts, expiresAt) VALUES (${id}, ${1}, ${expires})
    ON DUPLICATE KEY UPDATE
      attempts = IF(expiresAt <= ${now}, 1, LEAST(attempts + 1, ${limit + 1})),
      expiresAt = IF(expiresAt <= ${now}, ${expires}, expiresAt)
  `;
  const bucket = await prisma.employeeAuthThrottle.findUnique({ where: { id }, select: { attempts: true } });
  return !!bucket && bucket.attempts <= limit;
}

export async function allowEmployeeAuthAttempt(operation: "login", subject: string) {
  // The trusted proxy must replace this header with the actual client address.
  const ip = (await headers()).get("x-real-ip")?.slice(0, 64) || "unknown";
  if (!(await consume(`${operation}:ip`, ip, 30, 15 * minute))) return false;
  if (randomInt(64) === 0) {
    await prisma.$executeRaw`DELETE FROM EmployeeAuthThrottle WHERE expiresAt <= NOW(3) LIMIT 1000`;
    await prisma.$executeRaw`DELETE FROM EmployeePinSession WHERE expiresAt <= NOW(3) LIMIT 1000`;
  }
  return consume(`${operation}:account`, subject, 5, 15 * minute);
}

export function hashEmployeeCode(pin: string) {
  if (!isEmployeePin(pin)) throw new Error("Invalid login code.");
  return hash(keyedDigest("pin", pin), pinOptions);
}

export async function clearEmployeeLoginThrottle(phone: string) {
  await prisma.employeeAuthThrottle.deleteMany({ where: { id: keyedDigest("login:account", phone) } });
}

export async function authenticateEmployee(phoneInput: string, pin: string, remember: boolean) {
  const phone = normalizeEmployeePhone(phoneInput);
  if (!phone || !isEmployeePin(pin) || !(await allowEmployeeAuthAttempt("login", phone))) return null;
  const credential = await prisma.employeePinCredential.findUnique({
    where: { phone },
    select: { pinHash: true, user: { select: { id: true, role: true, status: true, employeeSessionVersion: true,
      employeeProfile: { select: { id: true, fullName: true } } } } },
  });
  const user = credential?.user;
  const valid = await verify(credential?.pinHash ?? dummyHash, keyedDigest("pin", pin));
  if (!valid || !credential?.pinHash || !user?.employeeProfile || user.role !== "EMPLOYEE" || user.status !== "APPROVED") return null;
  const employeeSession = newSecret();
  const expiresAt = employeeSessionExpiry(remember);
  await prisma.employeePinSession.create({
    data: { id: digest(employeeSession), userId: user.id, version: user.employeeSessionVersion, expiresAt },
  });
  return { id: String(user.id), role: user.role, status: user.status, employeeProfileId: user.employeeProfile.id,
    fullName: user.employeeProfile.fullName, employeeSession, employeeSessionExpiresAt: expiresAt.getTime() };
}

export async function getEmployeeSessionExpiry(id: string, userId: number) {
  const session = await prisma.employeePinSession.findUnique({
    where: { id: digest(id), userId, expiresAt: { gt: new Date() }, user: { role: "EMPLOYEE", status: "APPROVED" } },
    select: { version: true, expiresAt: true, user: { select: { employeeSessionVersion: true } } },
  });
  return session && session.version === session.user.employeeSessionVersion ? session.expiresAt : null;
}

export async function revokeEmployeeSession(id: string) {
  await prisma.employeePinSession.deleteMany({ where: { id: digest(id) } });
}
