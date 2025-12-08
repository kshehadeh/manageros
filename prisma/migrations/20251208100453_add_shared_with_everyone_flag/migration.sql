-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "sharedWithEveryone" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Note_sharedWithEveryone_idx" ON "Note"("sharedWithEveryone");
