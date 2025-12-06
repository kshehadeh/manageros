-- AlterTable: Add title field for standalone notes
ALTER TABLE "Note" ADD COLUMN "title" TEXT;

-- AlterTable: Make entityType and entityId nullable for standalone notes
ALTER TABLE "Note" ALTER COLUMN "entityType" DROP NOT NULL;
ALTER TABLE "Note" ALTER COLUMN "entityId" DROP NOT NULL;

-- CreateIndex: Add index on title for standalone notes
CREATE INDEX "Note_title_idx" ON "Note"("title");
