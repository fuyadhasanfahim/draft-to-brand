/**
 * Backfill CRM reference defaults (Industries, CompanySizes, LeadSources)
 * into existing organizations. Idempotent on slug — safe to re-run after
 * a workspace already contains custom entries.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import {
  DEFAULT_COMPANY_SIZES,
  DEFAULT_INDUSTRIES,
  DEFAULT_LEAD_SOURCES,
} from "../src/lib/crm/default-reference-data";
import {
  DEFAULT_PIPELINE,
  DEFAULT_PIPELINE_STAGES,
} from "../src/lib/crm/default-pipeline";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true, slug: true },
  });
  console.log(`→ Backfilling CRM defaults into ${orgs.length} organization(s)…`);

  for (const org of orgs) {
    const r1 = await prisma.industry.createMany({
      data: DEFAULT_INDUSTRIES.map((i) => ({ ...i, organizationId: org.id })),
      skipDuplicates: true,
    });
    const r2 = await prisma.companySize.createMany({
      data: DEFAULT_COMPANY_SIZES.map((s) => ({ ...s, organizationId: org.id })),
      skipDuplicates: true,
    });
    const r3 = await prisma.leadSource.createMany({
      data: DEFAULT_LEAD_SOURCES.map((s) => ({ ...s, organizationId: org.id })),
      skipDuplicates: true,
    });
    // Ensure a default Pipeline exists with its stages. Idempotent on slug.
    const existing = await prisma.pipeline.findFirst({
      where: { organizationId: org.id, slug: DEFAULT_PIPELINE.slug },
      select: { id: true },
    });
    let pipelineCreated = 0;
    let stagesCreated = 0;
    if (!existing) {
      const p = await prisma.pipeline.create({
        data: { ...DEFAULT_PIPELINE, organizationId: org.id, isDefault: true },
      });
      const r = await prisma.pipelineStage.createMany({
        data: DEFAULT_PIPELINE_STAGES.map((s) => ({ ...s, pipelineId: p.id })),
        skipDuplicates: true,
      });
      pipelineCreated = 1;
      stagesCreated = r.count;
    }

    console.log(
      `  ✓ ${org.name}  industries+${r1.count} sizes+${r2.count} sources+${r3.count} pipeline+${pipelineCreated} stages+${stagesCreated}`
    );
  }
  console.log("\n✓ CRM defaults backfilled.");
}

main()
  .catch((e) => {
    console.error("\n✗ Backfill failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
