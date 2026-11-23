import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { decode, encode } from "next-auth/jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { AccountStatus, UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { authenticateEmployee, getEmployeeSessionExpiry, revokeEmployeeSession } from "@/lib/employee-pin";
import { employeeCookieScope, isSessionCookie, withEmployeeCookieExpiry } from "@/lib/employee-session-cookie";

const INVALID_PASSWORD_HASH = "$2b$12$9Q4M4wJ0RnF4XG8it8tN9uPpXrCOJry09KQQZURawW9CrZdcNAcRi";

const secureCookies = process.env.NODE_ENV === "production";
const nextAuth = NextAuth({
  secret: process.env.AUTH_SECRET,
  debug: false,
  useSecureCookies: secureCookies,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  jwt: {
    async decode(options) {
      const token = await decode(options);
      const expiry = token?.employeeSessionExpiresAt;
      return token?.role === "EMPLOYEE" && typeof expiry === "number" && expiry <= Date.now() ? null : token;
    },
    async encode(options) {
      const expiry = options.token?.employeeSessionExpiresAt;
      if (options.token?.role !== "EMPLOYEE" || typeof expiry !== "number") return encode(options);
      const serialized = await encode({ ...options, maxAge: Math.floor((expiry - Date.now()) / 1000) });
      const scope = employeeCookieScope.getStore();
      if (scope) scope.expires = new Date(expiry);
      return serialized;
    },
  },
  pages: { signIn: "/employee-access/login" },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email or Employee ID", type: "text" },
        password: { label: "Password", type: "password" },
        portal: { type: "hidden" },
        phone: { label: "Phone", type: "tel" },
        pin: { label: "PIN", type: "password" },
        remember: { type: "hidden" },
      },
      async authorize(credentials) {
        if (credentials.portal === "employee") {
          if (typeof credentials.phone !== "string" || typeof credentials.pin !== "string") return null;
          try {
            return await authenticateEmployee(credentials.phone, credentials.pin, credentials.remember === "on");
          } catch {
            console.error("[auth] Employee PIN sign-in is unavailable.");
            return null;
          }
        }
        if (credentials.portal !== "admin" && credentials.portal !== "staff") return null;
        const identifier =
          typeof credentials.identifier === "string"
            ? credentials.identifier.trim()
            : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";
        const adminPortal = credentials.portal === "admin";

        if (!identifier || !password || identifier.length > 191 || password.length > 128) return null;
        const [clientLimit, accountLimit] = await Promise.all([
          consumeRateLimit("credentials-client", { limit: 50, windowMs: 15 * 60_000 }),
          consumeRateLimit("credentials-account", { limit: 10, windowMs: 15 * 60_000, discriminator: identifier }),
        ]);
        if (!clientLimit.allowed || !accountLimit.allowed) return null;

        const user = await prisma.user.findFirst({
          where: {
            role: adminPortal ? "ADMIN" : "SUPERVISOR",
            OR: adminPortal ? [{ email: identifier.toLowerCase() }] : [
              { email: identifier.toLowerCase() },
              { employeeProfile: { is: { employeeCode: identifier } } },
            ],
          },
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            passwordHash: true,
            employeeProfile: { select: { id: true, fullName: true } },
          },
        });

        const passwordMatches = await compare(password, user?.passwordHash ?? INVALID_PASSWORD_HASH);
        if (!user || !passwordMatches) return null;
        if (user.status !== "APPROVED") return null;

        return {
          id: String(user.id),
          email: user.email,
          role: user.role,
          status: user.status,
          employeeProfileId: user.employeeProfile?.id ?? null,
          fullName: user.employeeProfile?.fullName ?? null,
        };
      },
    }),
  ],
  events: {
    async signOut(message) {
      if ("token" in message && typeof message.token?.employeeSession === "string") {
        await revokeEmployeeSession(message.token.employeeSession);
      }
    },
  },
  callbacks: {
    redirect({ url, baseUrl }) {
      const base = new URL(baseUrl);
      let target: URL;
      try { target = new URL(url, base); } catch { return base.origin; }
      if (target.origin !== base.origin) return base.origin;
      // Resolve dashboard access using the current account even if a client
      // submits an admin URL as its Auth.js callback destination.
      if ((target.pathname === "/admin" || target.pathname.startsWith("/admin/")) && target.pathname !== "/admin/login") {
        return new URL("/employee-access", base).href;
      }
      return target.href;
    },
    async jwt({ token, user }) {
      if (user) {
        if (!user.id) return null;
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.employeeProfileId = user.employeeProfileId;
        token.fullName = user.fullName;
        token.employeeSession = user.employeeSession;
        token.employeeSessionExpiresAt = user.employeeSessionExpiresAt;
        return token;
      }
      const id = Number(token.id);
      if (!Number.isSafeInteger(id) || id <= 0) return null;
      if (token.role === "EMPLOYEE") {
        if (typeof token.employeeSession !== "string") return null;
        const expiry = await getEmployeeSessionExpiry(token.employeeSession, id);
        if (!expiry) return null;
        token.employeeSessionExpiresAt = expiry.getTime();
        return token;
      }
      const current = await prisma.user.findUnique({ where: { id }, select: { role: true, status: true } });
      if (!current || current.status !== "APPROVED" || current.role !== token.role) return null;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.status = token.status as AccountStatus;
      session.user.employeeProfileId = token.employeeProfileId as number | null;
      session.user.fullName = token.fullName as string | null;
      return token.role === "EMPLOYEE" && typeof token.employeeSessionExpiresAt === "number"
        ? { ...session, expires: new Date(token.employeeSessionExpiresAt).toISOString() }
        : session;
    },
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      // Protected pages and actions use the current database role. A stale
      // cookie must not choose a different dashboard before that check runs.
      if (pathname === "/admin/login" || session?.user?.id) return true;
      const login = pathname === "/admin" || pathname.startsWith("/admin/")
        ? "/admin/login"
        : pathname === "/supervisor" || pathname.startsWith("/supervisor/") ? "/supervisor-login" : "/employee-access/login";
      return Response.redirect(new URL(login, request.nextUrl));
    },
  },
});

export const { auth, signOut } = nextAuth;
export const handlers = {
  GET: (request: NextRequest) => withEmployeeCookieExpiry(() => nextAuth.handlers.GET(request)),
  POST: (request: NextRequest) => withEmployeeCookieExpiry(() => nextAuth.handlers.POST(request)),
};

export async function signIn(...args: Parameters<typeof nextAuth.signIn>) {
  const [provider, options, authorizationParams] = args;
  if (!options || options instanceof FormData || options.portal !== "employee") return nextAuth.signIn(...args);
  const scope: { expires?: Date } = {};
  const location = await employeeCookieScope.run(scope, () =>
    nextAuth.signIn(provider, { ...options, redirect: false }, authorizationParams));
  if (scope.expires) {
    const jar = await cookies();
    for (const cookie of jar.getAll()) {
      if (isSessionCookie(cookie.name) && cookie.value) {
        jar.set({ ...cookie, httpOnly: true, sameSite: "lax", secure: secureCookies, path: "/", expires: scope.expires });
      }
    }
  }
  if (options.redirect !== false) redirect(location);
  return location;
}
