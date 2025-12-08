-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "title" TEXT,
ALTER COLUMN "entityType" DROP NOT NULL,
ALTER COLUMN "entityId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Note_title_idx" ON "Note"("title");
