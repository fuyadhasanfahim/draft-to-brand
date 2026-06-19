-- CreateEnum
CREATE TYPE "SequenceStepCondition" AS ENUM ('ALWAYS', 'NOT_OPENED', 'OPENED_NOT_CLICKED', 'CLICKED_NOT_REPLIED');

-- CreateEnum
CREATE TYPE "SequenceEnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'STOPPED');

-- AlterEnum
ALTER TYPE "EmailEventType" ADD VALUE 'FOLLOWUP_SENT';

-- AlterTable
ALTER TABLE "email_campaign" ADD COLUMN     "sequenceId" TEXT;

-- CreateTable
CREATE TABLE "email_sequence" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_sequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_sequence_step" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "condition" "SequenceStepCondition" NOT NULL DEFAULT 'ALWAYS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_sequence_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_sequence_enrollment" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "status" "SequenceEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "nextRunAt" TIMESTAMP(3),
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_sequence_enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_sequence_organizationId_idx" ON "email_sequence"("organizationId");

-- CreateIndex
CREATE INDEX "email_sequence_organizationId_archivedAt_idx" ON "email_sequence"("organizationId", "archivedAt");

-- CreateIndex
CREATE INDEX "email_sequence_step_sequenceId_stepNumber_idx" ON "email_sequence_step"("sequenceId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "email_sequence_step_sequenceId_stepNumber_key" ON "email_sequence_step"("sequenceId", "stepNumber");

-- CreateIndex
CREATE INDEX "email_sequence_enrollment_status_nextRunAt_idx" ON "email_sequence_enrollment"("status", "nextRunAt");

-- CreateIndex
CREATE INDEX "email_sequence_enrollment_sequenceId_idx" ON "email_sequence_enrollment"("sequenceId");

-- CreateIndex
CREATE INDEX "email_sequence_enrollment_recipientId_idx" ON "email_sequence_enrollment"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "email_sequence_enrollment_sequenceId_recipientId_key" ON "email_sequence_enrollment"("sequenceId", "recipientId");

-- CreateIndex
CREATE INDEX "email_campaign_sequenceId_idx" ON "email_campaign"("sequenceId");

-- AddForeignKey
ALTER TABLE "email_campaign" ADD CONSTRAINT "email_campaign_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "email_sequence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence" ADD CONSTRAINT "email_sequence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence" ADD CONSTRAINT "email_sequence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence_step" ADD CONSTRAINT "email_sequence_step_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "email_sequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence_enrollment" ADD CONSTRAINT "email_sequence_enrollment_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "email_sequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence_enrollment" ADD CONSTRAINT "email_sequence_enrollment_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "email_recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
