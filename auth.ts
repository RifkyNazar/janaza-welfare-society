import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import type { AccountStatus, UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/employee-access/login" },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email or Employee ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier =
          typeof credentials.identifier === "string"
            ? credentials.identifier.trim()
            : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";

        if (!identifier || !password) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier.toLowerCase() },
              { employeeProfile: { is: { employeeCode: identifier } } },
            ],
          },
          include: { employeeProfile: true },
        });

        if (!user || !(await compare(password, user.passwordHash))) return null;
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
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.employeeProfileId = user.employeeProfileId;
        token.fullName = user.fullName;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.status = token.status as AccountStatus;
      session.user.employeeProfileId = token.employeeProfileId as number | null;
      session.user.fullName = token.fullName as string | null;
      return session;
    },
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      const user = session?.user;

      if (pathname === "/admin/login") {
        return true;
      }

      if (pathname.startsWith("/admin")) {
        if (user?.role === "ADMIN" && user.status === "APPROVED") {
          return true;
        }

        return Response.redirect(new URL("/admin/login", request.nextUrl));
      }

      if (pathname.startsWith("/employee")) {
        return user?.role === "EMPLOYEE" && user.status === "APPROVED";
      }

      if (pathname.startsWith("/supervisor")) {
        return (user?.role === "SUPERVISOR" || user?.role === "ADMIN") && user.status === "APPROVED";
      }

      return true;
    },
  },
});
