-- AlterTable
ALTER TABLE "FeedbackCampaign" ADD COLUMN     "inviteLink" TEXT;

-- CreateIndex
CREATE INDEX "FeedbackCampaign_inviteLink_idx" ON "FeedbackCampaign"("inviteLink");
