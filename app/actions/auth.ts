"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { signIn } from "@/auth";
import { notifyAdminsOfEmployeeRegistration } from "@/lib/notifications";
import { allowEmployeeAuthAttempt, enrollEmployeePin } from "@/lib/employee-pin";
import { isEmployeePin, normalizeEmployeePhone, NO_STAFF_PASSWORD, PIN_ONLY_EMAIL_SUFFIX } from "@/lib/employee-phone";
import { assertEmployeePhonesAvailable, EmployeePhoneConflict, employeePhoneTransaction } from "@/lib/employee-phone-registration";

export type AuthActionState = {
  error?: string;
  success?: string;
  values?: { fullName?: string; position?: string; phone?: string; identifier?: string; email?: string };
};

function value(formData: FormData, name: string) {
  const field = formData.get(name);
  return typeof field === "string" ? field.trim() : "";
}

export async function registerEmployee(
  _state: AuthActionState,
  form: FormData,
): Promise<AuthActionState> {
  const fullName = value(form, "fullName");
  const phoneInput = value(form, "phone");
  const position = value(form, "position");
  const values = { fullName, phone: phoneInput, position };
  const phone = normalizeEmployeePhone(phoneInput);
  if (!fullName || !position || fullName.length > 150 || position.length > 150) {
    return { error: "Enter your full name and position, up to 150 characters each.", values };
  }
  if (!phone) return { error: "Enter a valid Sri Lankan phone number.", values };

  let employee;
  try {
    if (!(await allowEmployeeAuthAttempt("register", phone))) {
      return { error: "Unable to submit another registration right now. Please try again later.", values };
    }
    const reference = randomUUID();
    employee = await employeePhoneTransaction(async tx => {
      await assertEmployeePhonesAvailable(tx, [phone]);
      return tx.user.create({
        data: {
          email: reference + PIN_ONLY_EMAIL_SUFFIX,
          passwordHash: NO_STAFF_PASSWORD,
          role: "EMPLOYEE",
          status: "PENDING",
          employeeProfile: { create: { fullName, phone, position, employeeCode: "JWS-" + reference, isPublicProfile: false } },
        },
        select: { id: true, createdAt: true, employeeProfile: { select: { employeeCode: true } } },
      });
    });
  } catch (error) {
    if (error instanceof EmployeePhoneConflict) {
      return { error: "Unable to register with this phone number. Check the number or contact JWS for help.", values };
    }
    console.warn("[auth] Employee registration failed.", error instanceof Prisma.PrismaClientKnownRequestError ? error.code : "registration unavailable");
    return { error: "Unable to complete registration right now. Please try again later.", values };
  }
  const notification = {
    employeeId: employee.id,
    fullName,
    employeeCode: employee.employeeProfile?.employeeCode,
    registeredAt: employee.createdAt,
  };
  after(() => notifyAdminsOfEmployeeRegistration(notification));
  redirect("/employee-access/register/success");
}

const employeeLoginError = "Unable to sign in. Check your phone number and PIN, try again later, or contact JWS about your approval or account access.";

export async function employeeLogin(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const phoneInput = value(form, "phone");
  const phone = normalizeEmployeePhone(phoneInput);
  const pin = form.get("pin");
  const values = { phone: phoneInput };
  if (!phone || typeof pin !== "string" || !isEmployeePin(pin)) return { error: "Enter a Sri Lankan phone number and a six-digit PIN.", values };
  try {
    await signIn("credentials", {
      phone, pin, portal: "employee",
      remember: form.get("remember") === "on" ? "on" : "off",
      redirectTo: "/employee",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: employeeLoginError, values };
    throw error;
  }
  return {};
}

export async function setupEmployeePin(_state: AuthActionState, form: FormData): Promise<AuthActionState> {
  const phone = normalizeEmployeePhone(value(form, "phone"));
  const token = value(form, "token");
  const pin = form.get("pin");
  if (!phone || typeof pin !== "string" || !isEmployeePin(pin) || pin !== form.get("confirmPin")) {
    return { error: "Enter your verified phone number and two matching six-digit PINs." };
  }
  try {
    if (!(await enrollEmployeePin(phone, token, pin))) return { error: "Unable to set your PIN. Check your setup token or ask JWS for a new one." };
  } catch {
    return { error: "Unable to set your PIN. Check your setup token or ask JWS for a new one." };
  }
  redirect("/employee-access/login?pinSet=1");
}

export async function login(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const identifier = value(formData, "identifier");
  const password = formData.get("password");
  const values = { identifier };

  if (!identifier || typeof password !== "string" || !password || identifier.length > 191 || password.length > 128) {
    return { error: "Enter your email or employee ID and password.", values };
  }

  try {
    await signIn("credentials", {
      identifier,
      password,
      portal: "staff",
      redirectTo: "/supervisor-login",
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

  if (!email || !password || email.length > 191 || password.length > 128) {
    return { error: "Enter your email and password.", values };
  }

  try {
    await signIn("credentials", {
      identifier: email,
      password,
      portal: "admin",
      redirectTo: "/admin/login",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Unable to sign in with those credentials.", values };
    }
    throw error;
  }

  return {};
}
