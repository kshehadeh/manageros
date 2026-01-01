-- AlterTable
ALTER TABLE "Initiative" ADD COLUMN     "size" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "initiativeSizeDefinitions" JSONB;
