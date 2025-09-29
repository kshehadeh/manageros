-- AlterTable
ALTER TABLE "JobLevel" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "JobLevel_order_idx" ON "JobLevel"("order");
