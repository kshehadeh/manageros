-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "billingUserId" TEXT,
ADD COLUMN     "subscriptionPlanId" TEXT,
ADD COLUMN     "subscriptionPlanName" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;

-- CreateIndex
CREATE INDEX "Organization_billingUserId_idx" ON "Organization"("billingUserId");

-- CreateIndex
CREATE INDEX "Organization_subscriptionPlanId_idx" ON "Organization"("subscriptionPlanId");

-- CreateIndex
CREATE INDEX "Organization_subscriptionStatus_idx" ON "Organization"("subscriptionStatus");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_billingUserId_fkey" FOREIGN KEY ("billingUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
