-- CreateEnum
CREATE TYPE "NotificationRecordType" AS ENUM ('EMAIL', 'SMS');

-- CreateTable
CREATE TABLE "NotificationRecord" (
    "id" TEXT NOT NULL,
    "type" "NotificationRecordType" NOT NULL DEFAULT 'EMAIL',
    "campaignId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationRecord_campaignId_idx" ON "NotificationRecord"("campaignId");

-- CreateIndex
CREATE INDEX "NotificationRecord_recipientEmail_idx" ON "NotificationRecord"("recipientEmail");

-- CreateIndex
CREATE INDEX "NotificationRecord_sentAt_idx" ON "NotificationRecord"("sentAt");

-- CreateIndex
CREATE INDEX "NotificationRecord_type_idx" ON "NotificationRecord"("type");

-- AddForeignKey
ALTER TABLE "NotificationRecord" ADD CONSTRAINT "NotificationRecord_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "FeedbackCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
