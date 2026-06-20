import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const accounts = await prisma.account.findMany({
    include: { user: true },
  });
  for (const acc of accounts) {
    console.log(`User: ${acc.user.email}, Provider: ${acc.providerId}, Hash: ${acc.password}`);
  }
}

main().finally(() => prisma.$disconnect());
