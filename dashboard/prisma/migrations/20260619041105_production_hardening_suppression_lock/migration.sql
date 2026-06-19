-- CreateEnum
CREATE TYPE "SuppressionReason" AS ENUM ('UNSUBSCRIBE', 'BOUNCE', 'COMPLAINT', 'MANUAL');

-- AlterTable
ALTER TABLE "email_sequence_enrollment" ADD COLUMN     "lockedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "suppression_list" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" "SuppressionReason" NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppression_list_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppression_list_organizationId_email_idx" ON "suppression_list"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "suppression_list_organizationId_email_key" ON "suppression_list"("organizationId", "email");

-- AddForeignKey
ALTER TABLE "suppression_list" ADD CONSTRAINT "suppression_list_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
