"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdminsOfEmployeeRegistration } from "@/lib/notifications";
import { consumeRateLimit } from "@/lib/rate-limit";

export type AuthActionState = {
  error?: string;
  success?: string;
  values?: { fullName?: string; employeeCode?: string; position?: string; phone?: string; email?: string; identifier?: string; confirmation?: boolean };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_PASSWORD_HASH = "$2b$12$9Q4M4wJ0RnF4XG8it8tN9uPpXrCOJry09KQQZURawW9CrZdcNAcRi";

function value(formData: FormData, name: string) {
  const field = formData.get(name);
  return typeof field === "string" ? field.trim() : "";
}

export async function registerEmployee(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = value(formData, "fullName");
  const employeeCode = value(formData, "employeeCode");
  const position = value(formData, "position");
  const phone = value(formData, "phone");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const confirmPassword = value(formData, "confirmPassword");
  const values = { fullName, employeeCode, position, phone, email, confirmation: formData.get("confirmation") === "on" };

  const rateLimit = await consumeRateLimit("employee-registration", { limit: 5, windowMs: 60 * 60_000 });
  if (!rateLimit.allowed) return { error: "Too many registration attempts. Please try again later.", values };

  if (!fullName || !employeeCode || !position || !phone || !email || !password || !confirmPassword) {
    return { error: "Please complete all required fields.", values };
  }
  if (!emailPattern.test(email)) {
    return { error: "Please enter a valid email address.", values };
  }
  if (fullName.length > 150 || employeeCode.length > 64 || position.length > 150 || phone.length > 30 || email.length > 191 || password.length > 128) {
    return { error: "One or more fields exceed the allowed length.", values };
  }
  if (!/^[A-Za-z0-9_-]{2,64}$/.test(employeeCode) || !/^[+]?[0-9][0-9\s-]{7,20}$/.test(phone)) {
    return { error: "Please enter a valid employee ID and phone number.", values };
  }
  if (password.length < 12) {
    return { error: "Password must be at least 12 characters.", values };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match.", values };
  }

  const passwordHash = await hash(password, 12);

  try {
    const employee = await prisma.$transaction(async (transaction) => {
      return transaction.user.create({
        data: {
          email,
          passwordHash,
          role: "EMPLOYEE",
          status: "PENDING",
          employeeProfile: {
            create: {
              employeeCode,
              fullName,
              phone,
              position,
              isPublicProfile: false,
            },
          },
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
          employeeProfile: { select: { fullName: true, employeeCode: true } },
        },
      });
    });
    try {
      await notifyAdminsOfEmployeeRegistration({
        employeeId: employee.id,
        fullName: employee.employeeProfile?.fullName ?? fullName,
        email: employee.email,
        employeeCode: employee.employeeProfile?.employeeCode,
        registeredAt: employee.createdAt,
      });
    } catch {
      console.error("[notifications] Employee registration notification failed after registration completed.");
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Unable to complete registration with those details.", values };
    }
    throw error;
  }

  redirect("/employee-access/register/success");
}

export async function login(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const identifier = value(formData, "identifier");
  const password = value(formData, "password");
  const values = { identifier };

  const rateLimit = await consumeRateLimit("employee-login", { limit: 10, windowMs: 15 * 60_000, discriminator: identifier });
  if (!rateLimit.allowed) return { error: "Too many login attempts. Please try again later.", values };

  if (!identifier || !password || identifier.length > 191 || password.length > 128) {
    return { error: "Enter your email or employee ID and password.", values };
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { employeeProfile: { is: { employeeCode: identifier } } },
      ],
    },
    select: { passwordHash: true, role: true, status: true },
  });

  const passwordMatches = await compare(password, user?.passwordHash ?? INVALID_PASSWORD_HASH);
  if (!user || !passwordMatches) {
    return { error: "Invalid login credentials.", values };
  }
  if (user.status !== "APPROVED") {
    return { error: "Invalid login credentials.", values };
  }

  try {
    await signIn("credentials", {
      identifier,
      password,
      redirectTo: user.role === "ADMIN" ? "/admin" : user.role === "SUPERVISOR" ? "/supervisor" : "/employee",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Unable to sign in with those credentials.", values };
    }
    throw error;
  }

  return {};
}

export async function adminLogin(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = value(formData, "email").toLowerCase();
  const passwordField = formData.get("password");
  const password = typeof passwordField === "string" ? passwordField : "";
  const values = { email };

  const rateLimit = await consumeRateLimit("admin-login", { limit: 10, windowMs: 15 * 60_000, discriminator: email });
  if (!rateLimit.allowed) return { error: "Too many login attempts. Please try again later.", values };

  if (!email || !password || email.length > 191 || password.length > 128) {
    return { error: "Enter your email and password.", values };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { passwordHash: true, role: true, status: true },
  });

  const passwordMatches = await compare(password, user?.passwordHash ?? INVALID_PASSWORD_HASH);
  if (
    !user ||
    !passwordMatches ||
    user.role !== "ADMIN" ||
    user.status !== "APPROVED"
  ) {
    return { error: "Invalid email or password.", values };
  }

  try {
    await signIn("credentials", {
      identifier: email,
      password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Unable to sign in with those credentials.", values };
    }
    throw error;
  }

  return {};
}
