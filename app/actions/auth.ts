"use server";

import { AuthError } from "next-auth";
import { compare, hash } from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdminsOfEmployeeRegistration } from "@/lib/notifications";

export type AuthActionState = {
  error?: string;
  success?: string;
  values?: { fullName?: string; employeeCode?: string; position?: string; phone?: string; email?: string; identifier?: string; confirmation?: boolean };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (!fullName || !employeeCode || !position || !phone || !email || !password || !confirmPassword) {
    return { error: "Please complete all required fields.", values };
  }
  if (!emailPattern.test(email)) {
    return { error: "Please enter a valid email address.", values };
  }
  if (password.length < 12) {
    return { error: "Password must be at least 12 characters.", values };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match.", values };
  }

  const duplicate = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { employeeProfile: { is: { employeeCode } } }],
    },
    select: { id: true },
  });

  if (duplicate) {
    return { error: "That email or employee ID is already registered.", values };
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
      console.error("[email] Employee registration notification failed after registration completed.");
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "That email or employee ID is already registered.", values };
    }
    throw error;
  }

  return {
    success: "Registration submitted. Your account requires administrator approval before login.",
  };
}

export async function login(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const identifier = value(formData, "identifier");
  const password = value(formData, "password");
  const values = { identifier };

  if (!identifier || !password) {
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

  if (!user || !(await compare(password, user.passwordHash))) {
    return { error: "Invalid login credentials.", values };
  }
  if (user.status === "PENDING") {
    return { error: "Your account is awaiting administrator approval.", values };
  }
  if (user.status !== "APPROVED") {
    return { error: "Access to this account is unavailable.", values };
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

  if (!email || !password) {
    return { error: "Enter your email and password.", values };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { passwordHash: true, role: true, status: true },
  });

  if (
    !user ||
    !(await compare(password, user.passwordHash)) ||
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
