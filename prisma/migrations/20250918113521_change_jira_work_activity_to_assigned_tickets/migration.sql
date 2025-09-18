/*
  Warnings:

  - You are about to drop the `JiraWorkActivity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JiraWorkActivity" DROP CONSTRAINT "JiraWorkActivity_personId_fkey";

-- DropTable
DROP TABLE "JiraWorkActivity";

-- CreateTable
CREATE TABLE "JiraAssignedTicket" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "jiraIssueKey" TEXT NOT NULL,
    "jiraIssueId" TEXT NOT NULL,
    "issueTitle" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT,
    "projectKey" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraAssignedTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JiraAssignedTicket_personId_idx" ON "JiraAssignedTicket"("personId");

-- CreateIndex
CREATE INDEX "JiraAssignedTicket_jiraIssueKey_idx" ON "JiraAssignedTicket"("jiraIssueKey");

-- CreateIndex
CREATE INDEX "JiraAssignedTicket_lastUpdated_idx" ON "JiraAssignedTicket"("lastUpdated");

-- CreateIndex
CREATE UNIQUE INDEX "JiraAssignedTicket_personId_jiraIssueId_key" ON "JiraAssignedTicket"("personId", "jiraIssueId");

-- AddForeignKey
ALTER TABLE "JiraAssignedTicket" ADD CONSTRAINT "JiraAssignedTicket_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
