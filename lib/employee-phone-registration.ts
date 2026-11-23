import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { normalizeEmployeePhone } from "@/lib/employee-phone";
import { prisma } from "@/lib/prisma";

export class EmployeePhoneConflict extends Error {}

export function employeePhoneTransaction<T>(run: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(run, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
}

export function lockEmployeePhoneAccount(tx: Prisma.TransactionClient, userId: number) {
  return tx.$queryRaw`SELECT id FROM \`User\` WHERE id = ${userId} FOR UPDATE`;
}

export function normalizedEmployeePhones(...values: (string | null | undefined)[]) {
  return [...new Set(values.flatMap(value => {
    const phone = value && normalizeEmployeePhone(value);
    return phone ? [phone] : [];
  }))].sort();
}

async function activeEmployees(db: Pick<Prisma.TransactionClient, "user">, excludeUserId?: number) {
  return db.user.findMany({
    where: { role: "EMPLOYEE", status: { in: ["PENDING", "APPROVED"] }, ...(excludeUserId !== undefined && { id: { not: excludeUserId } }) },
    select: {
      id: true,
      status: true,
      employeeProfile: { select: { phone: true, fullName: true, employeeCode: true } },
      employeePin: { select: { phone: true } },
    },
    orderBy: { id: "asc" },
  });
}

export async function assertEmployeePhonesAvailable(tx: Prisma.TransactionClient, phones: string[], excludeUserId?: number) {
  if (!phones.length) return;
  // The primary key serializes writers for each number. ReadCommitted lets the
  // check see the previous holder's committed account after the lock is acquired.
  for (const phone of phones) {
    await tx.$executeRaw`
      INSERT INTO EmployeePhoneRegistrationLock (phone) VALUES (${phone})
      ON DUPLICATE KEY UPDATE phone = phone
    `;
  }
  const requested = new Set(phones);
  const accounts = await activeEmployees(tx, excludeUserId);
  if (accounts.some(account => normalizedEmployeePhones(account.employeeProfile?.phone, account.employeePin?.phone)
    .some(phone => requested.has(phone)))) {
    throw new EmployeePhoneConflict();
  }
}

export async function assertEmployeeAccountPhonesAvailable(tx: Prisma.TransactionClient, userId: number) {
  const account = await tx.user.findUniqueOrThrow({
    where: { id: userId },
    select: { employeeProfile: { select: { phone: true } }, employeePin: { select: { phone: true } } },
  });
  await assertEmployeePhonesAvailable(tx, normalizedEmployeePhones(account.employeeProfile?.phone, account.employeePin?.phone), userId);
}

export async function findEmployeePhoneConflicts() {
  const accounts = await activeEmployees(prisma);
  const groups = new Map<string, typeof accounts>();
  for (const account of accounts) {
    for (const phone of normalizedEmployeePhones(account.employeeProfile?.phone, account.employeePin?.phone)) {
      const group = groups.get(phone) ?? [];
      group.push(account);
      groups.set(phone, group);
    }
  }
  return [...groups.entries()].filter(([, group]) => group.length > 1).sort(([a], [b]) => a.localeCompare(b));
}
