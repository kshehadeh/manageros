/*
  Warnings:

  - You are about to drop the `JiraAssignedTicket` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JiraAssignedTicket" DROP CONSTRAINT "JiraAssignedTicket_personId_fkey";

-- DropTable
DROP TABLE "JiraAssignedTicket";

-- CreateTable
CREATE TABLE "FeedbackCampaign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetPersonId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "inviteEmails" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackResponse" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "responderEmail" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedbackCampaign_userId_idx" ON "FeedbackCampaign"("userId");

-- CreateIndex
CREATE INDEX "FeedbackCampaign_targetPersonId_idx" ON "FeedbackCampaign"("targetPersonId");

-- CreateIndex
CREATE INDEX "FeedbackCampaign_status_idx" ON "FeedbackCampaign"("status");

-- CreateIndex
CREATE INDEX "FeedbackCampaign_startDate_idx" ON "FeedbackCampaign"("startDate");

-- CreateIndex
CREATE INDEX "FeedbackCampaign_endDate_idx" ON "FeedbackCampaign"("endDate");

-- CreateIndex
CREATE INDEX "FeedbackResponse_campaignId_idx" ON "FeedbackResponse"("campaignId");

-- CreateIndex
CREATE INDEX "FeedbackResponse_responderEmail_idx" ON "FeedbackResponse"("responderEmail");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackResponse_campaignId_responderEmail_key" ON "FeedbackResponse"("campaignId", "responderEmail");

-- AddForeignKey
ALTER TABLE "FeedbackCampaign" ADD CONSTRAINT "FeedbackCampaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackCampaign" ADD CONSTRAINT "FeedbackCampaign_targetPersonId_fkey" FOREIGN KEY ("targetPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackResponse" ADD CONSTRAINT "FeedbackResponse_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "FeedbackCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
