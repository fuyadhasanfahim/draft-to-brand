-- CreateEnum
CREATE TYPE "EmailDeliveryScope" AS ENUM ('VERIFICATION_OTP_SENT', 'INVITATION_SENT', 'PASSWORD_RESET_SENT', 'WELCOME_SENT', 'VERIFICATION_OTP_FAILED');

-- CreateTable
CREATE TABLE "email_delivery_log" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "scope" "EmailDeliveryScope" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_delivery_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_delivery_log_identifier_scope_createdAt_idx" ON "email_delivery_log"("identifier", "scope", "createdAt");
