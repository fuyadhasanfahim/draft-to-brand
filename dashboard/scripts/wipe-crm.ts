/**
 * One-shot: wipe disposable CRM rows so the Phase 2A.5 migration
 * (which drops free-text Company columns) runs clean. Owner / Members /
 * org graph / audit / invitations are untouched.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log("→ Wiping CRM tables…");
  const r1 = await prisma.companyTag.deleteMany({});
  const r2 = await prisma.contactTag.deleteMany({});
  const r3 = await prisma.note.deleteMany({});
  const r4 = await prisma.contact.deleteMany({});
  const r5 = await prisma.company.deleteMany({});
  console.log(`  company_tag  ${r1.count}`);
  console.log(`  contact_tag  ${r2.count}`);
  console.log(`  note         ${r3.count}`);
  console.log(`  contact      ${r4.count}`);
  console.log(`  company      ${r5.count}`);
  console.log("\n✓ CRM wiped.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
