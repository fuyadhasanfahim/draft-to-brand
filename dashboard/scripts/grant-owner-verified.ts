/**
 * One-time housekeeping: mark the existing owner account as emailVerified
 * so they aren't suddenly locked behind the new verification gate on a
 * workspace they already own.
 *
 *   tsx scripts/grant-owner-verified.ts [email]
 *
 * If no email is passed, the script falls back to the OWNER_EMAIL env var.
 * It only flips `emailVerified` from false → true and never the other way.
 * Safe to re-run.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = (process.argv[2] ?? process.env.OWNER_EMAIL ?? "").toLowerCase();
  if (!email) {
    console.error("Usage: tsx scripts/grant-owner-verified.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`✗ No user found for ${email}`);
    process.exit(1);
  }
  if (user.emailVerified) {
    console.log(`✓ ${email} is already verified — nothing to do.`);
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });
  console.log(`✓ ${email} marked as verified.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
