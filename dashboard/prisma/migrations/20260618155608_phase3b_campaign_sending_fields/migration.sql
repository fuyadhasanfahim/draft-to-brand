-- AlterTable
ALTER TABLE "email_campaign" ADD COLUMN     "fromName" TEXT,
ADD COLUMN     "replyTo" TEXT;

-- AlterTable
ALTER TABLE "email_recipient" ADD COLUMN     "companyId" TEXT;

-- CreateIndex
CREATE INDEX "email_recipient_companyId_idx" ON "email_recipient"("companyId");

-- AddForeignKey
ALTER TABLE "email_recipient" ADD CONSTRAINT "email_recipient_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
