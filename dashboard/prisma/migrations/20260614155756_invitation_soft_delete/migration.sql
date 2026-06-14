-- AlterEnum
ALTER TYPE "InvitationStatus" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "invitation" ADD COLUMN     "deletedAt" TIMESTAMP(3);
