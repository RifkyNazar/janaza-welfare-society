import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConstructor: typeof PrismaClient | undefined;
  prismaDatabaseUrl: string | undefined;
};

// A client constructed before `prisma generate` retains its old model delegates.
// Next dev keeps globalThis across HMR, so key the cache to the generated class
// and connection configuration, not just the presence of a previous instance.
const development = process.env.NODE_ENV !== "production";
const cached = development ? globalForPrisma.prisma : undefined;
const reusable = cached && globalForPrisma.prismaConstructor === PrismaClient && globalForPrisma.prismaDatabaseUrl === databaseUrl;

export const prisma =
  reusable ? cached : new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });

if (development) {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaConstructor = PrismaClient;
  globalForPrisma.prismaDatabaseUrl = databaseUrl;
  if (cached && cached !== prisma) {
    void cached.$disconnect().catch(() => {
      console.warn("[prisma] Superseded development client could not close its pool.");
    });
  }
}
