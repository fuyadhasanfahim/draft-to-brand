-- AlterTable
ALTER TABLE "branch" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "department" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "team" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "teamLeadId" TEXT;
