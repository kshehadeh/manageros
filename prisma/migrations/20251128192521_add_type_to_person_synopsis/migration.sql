-- AlterTable
ALTER TABLE "PersonSynopsis" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'overview';

-- CreateIndex
CREATE INDEX "PersonSynopsis_type_idx" ON "PersonSynopsis"("type");
