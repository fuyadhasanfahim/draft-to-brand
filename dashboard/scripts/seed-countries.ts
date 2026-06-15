/**
 * Idempotent country seed.
 *
 *   - Sources the canonical ISO 3166-1 list from prisma/data/countries.json.
 *   - Upserts by iso2 — re-runs are no-ops; updates flow through cleanly when
 *     the bundled JSON is amended (e.g., phone-code corrections).
 *   - Never deletes rows. If a country is removed from the JSON it stays in
 *     the DB (Company.countryId may already reference it).
 *
 * Run: npm run db:seed-countries
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

type Row = { name: string; iso2: string; iso3: string; phoneCode: string };

async function main() {
  const file = resolve(process.cwd(), "prisma/data/countries.json");
  const rows = JSON.parse(readFileSync(file, "utf8")) as Row[];

  console.log(`→ Seeding ${rows.length} countries…`);
  let created = 0;
  let updated = 0;
  for (const r of rows) {
    const existing = await prisma.country.findUnique({ where: { iso2: r.iso2 } });
    if (existing) {
      const drift =
        existing.name !== r.name ||
        existing.iso3 !== r.iso3 ||
        existing.phoneCode !== r.phoneCode;
      if (drift) {
        await prisma.country.update({
          where: { iso2: r.iso2 },
          data: { name: r.name, iso3: r.iso3, phoneCode: r.phoneCode },
        });
        updated++;
      }
    } else {
      await prisma.country.create({ data: r });
      created++;
    }
  }
  console.log(`✓ Created ${created}, updated ${updated}, unchanged ${rows.length - created - updated}`);
}

main()
  .catch((e) => {
    console.error("\n✗ Country seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
