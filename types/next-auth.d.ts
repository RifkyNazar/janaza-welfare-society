import type { DefaultSession } from "next-auth";
import type { AccountStatus, UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: UserRole;
    status: AccountStatus;
    employeeProfileId: number | null;
    fullName: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: AccountStatus;
      employeeProfileId: number | null;
      fullName: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: AccountStatus;
    employeeProfileId: number | null;
    fullName: string | null;
  }
}
