import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error("Set ADMIN_EMAIL in .env before seeding");

  await prisma.user.upsert({
    where: { email },
    update: { role: "admin" },
    create: { email, name: "Admin", role: "admin", emailVerified: true },
  });
  console.log(`Admin account ready for ${email}`);
}

main().finally(() => prisma.$disconnect());
