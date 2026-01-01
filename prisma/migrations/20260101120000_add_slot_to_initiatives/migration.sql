-- AlterTable
ALTER TABLE "Initiative" ADD COLUMN "slot" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Initiative_organizationId_slot_key" ON "Initiative"("organizationId", "slot");
