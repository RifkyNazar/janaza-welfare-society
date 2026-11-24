"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { isEmployeePin, normalizeEmployeePhone } from "@/lib/employee-phone";

export type AuthActionState = {
  error?: string;
  success?: string;
  values?: { fullName?: string; position?: string; phone?: string; identifier?: string; email?: string };
};

function value(formData: FormData, name: string) {
  const field = formData.get(name);
  return typeof field === "string" ? field.trim() : "";
}

const employeeLoginError = "Unable to sign in. Check your phone number and PIN, try again later, or contact JWS about account access.";

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
