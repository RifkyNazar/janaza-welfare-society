import { hash } from "bcryptjs";
import { prisma } from "../lib/prisma";

class SeedConfigurationError extends Error {}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email) {
    throw new SeedConfigurationError("ADMIN_EMAIL is required.");
  }

  if (!password) {
    throw new SeedConfigurationError("ADMIN_PASSWORD is required.");
  }

  if (password.length < 12) {
    throw new SeedConfigurationError(
      "ADMIN_PASSWORD must be at least 12 characters.",
    );
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "APPROVED",
    },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  console.log("Admin account created or updated successfully.");
}

main()
  .catch((error: unknown) => {
    if (error instanceof SeedConfigurationError) {
      console.error(error.message);
    } else {
      console.error("Admin seed failed.");
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
