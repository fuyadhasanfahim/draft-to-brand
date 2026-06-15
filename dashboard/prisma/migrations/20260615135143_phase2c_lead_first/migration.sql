-- Phase 2C — Lead-first refactor.
--
-- 1. Adds the StageOutcome enum and PipelineStage.outcome flag.
--    Existing seeded pipelines used slugs `won` / `lost` for terminal stages,
--    so we backfill `outcome` from those slugs and leave everything else OPEN.
-- 2. Replaces Lead.currency (free-text VARCHAR(3)) with the new Currency enum.
--    Existing values that match the allowlist are preserved; anything else
--    becomes NULL rather than failing the migration.

-- CreateEnum
CREATE TYPE "StageOutcome" AS ENUM ('OPEN', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED', 'BDT');

-- AlterTable: PipelineStage.outcome with backfill from slug
ALTER TABLE "pipeline_stage" ADD COLUMN "outcome" "StageOutcome" NOT NULL DEFAULT 'OPEN';
UPDATE "pipeline_stage" SET "outcome" = 'WON'  WHERE "slug" = 'won';
UPDATE "pipeline_stage" SET "outcome" = 'LOST' WHERE "slug" = 'lost';

-- AlterTable: Lead.currency VARCHAR → Currency enum, preserving valid codes
ALTER TABLE "lead"
  ALTER COLUMN "currency" TYPE "Currency"
  USING (
    CASE UPPER(TRIM("currency"))
      WHEN 'USD' THEN 'USD'::"Currency"
      WHEN 'EUR' THEN 'EUR'::"Currency"
      WHEN 'GBP' THEN 'GBP'::"Currency"
      WHEN 'AUD' THEN 'AUD'::"Currency"
      WHEN 'CAD' THEN 'CAD'::"Currency"
      WHEN 'SGD' THEN 'SGD'::"Currency"
      WHEN 'AED' THEN 'AED'::"Currency"
      WHEN 'BDT' THEN 'BDT'::"Currency"
      ELSE NULL
    END
  );
