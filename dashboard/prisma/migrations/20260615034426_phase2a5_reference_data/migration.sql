/*
  Warnings:

  - You are about to drop the column `country` on the `company` table. All the data in the column will be lost.
  - You are about to drop the column `industry` on the `company` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "company" DROP COLUMN "country",
DROP COLUMN "industry",
DROP COLUMN "size",
ADD COLUMN     "companySizeId" TEXT,
ADD COLUMN     "countryId" TEXT,
ADD COLUMN     "industryId" TEXT,
ADD COLUMN     "leadSourceId" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "primaryContactId" TEXT;

-- CreateTable
CREATE TABLE "country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iso2" TEXT NOT NULL,
    "iso3" TEXT NOT NULL,
    "phoneCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_size" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_size_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_source" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6b6e6e',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_source_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "country_iso2_key" ON "country"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "country_iso3_key" ON "country"("iso3");

-- CreateIndex
CREATE INDEX "country_name_idx" ON "country"("name");

-- CreateIndex
CREATE INDEX "industry_organizationId_isActive_idx" ON "industry"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "industry_organizationId_slug_key" ON "industry"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "company_size_organizationId_isActive_sortOrder_idx" ON "company_size"("organizationId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "company_size_organizationId_slug_key" ON "company_size"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "lead_source_organizationId_isActive_idx" ON "lead_source"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "lead_source_organizationId_slug_key" ON "lead_source"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "company_industryId_idx" ON "company"("industryId");

-- CreateIndex
CREATE INDEX "company_countryId_idx" ON "company"("countryId");

-- CreateIndex
CREATE INDEX "company_companySizeId_idx" ON "company"("companySizeId");

-- CreateIndex
CREATE INDEX "company_leadSourceId_idx" ON "company"("leadSourceId");

-- CreateIndex
CREATE INDEX "company_ownerId_idx" ON "company"("ownerId");

-- CreateIndex
CREATE INDEX "company_primaryContactId_idx" ON "company"("primaryContactId");

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "industry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_companySizeId_fkey" FOREIGN KEY ("companySizeId") REFERENCES "company_size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_leadSourceId_fkey" FOREIGN KEY ("leadSourceId") REFERENCES "lead_source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company" ADD CONSTRAINT "company_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry" ADD CONSTRAINT "industry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry" ADD CONSTRAINT "industry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_size" ADD CONSTRAINT "company_size_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_size" ADD CONSTRAINT "company_size_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_source" ADD CONSTRAINT "lead_source_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_source" ADD CONSTRAINT "lead_source_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
