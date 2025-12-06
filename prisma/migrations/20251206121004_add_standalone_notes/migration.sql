-- AlterTable
ALTER TABLE "Note" ADD COLUMN "title" TEXT;

-- AlterTable
ALTER TABLE "Note" ALTER COLUMN "entityType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Note" ALTER COLUMN "entityId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Note_title_idx" ON "Note"("title");
