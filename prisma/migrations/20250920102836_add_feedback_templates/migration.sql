-- AlterTable
ALTER TABLE "FeedbackCampaign" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "FeedbackTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackQuestion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "options" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedbackTemplate_isDefault_idx" ON "FeedbackTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "FeedbackQuestion_templateId_idx" ON "FeedbackQuestion"("templateId");

-- CreateIndex
CREATE INDEX "FeedbackQuestion_sortOrder_idx" ON "FeedbackQuestion"("sortOrder");

-- CreateIndex
CREATE INDEX "FeedbackCampaign_templateId_idx" ON "FeedbackCampaign"("templateId");

-- AddForeignKey
ALTER TABLE "FeedbackCampaign" ADD CONSTRAINT "FeedbackCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FeedbackTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackQuestion" ADD CONSTRAINT "FeedbackQuestion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FeedbackTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
