-- CreateTable
CREATE TABLE "UserJiraCredentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jiraUsername" TEXT NOT NULL,
    "encryptedApiKey" TEXT NOT NULL,
    "jiraBaseUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserJiraCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonJiraAccount" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "jiraAccountId" TEXT NOT NULL,
    "jiraEmail" TEXT NOT NULL,
    "jiraDisplayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonJiraAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraWorkActivity" (
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
    "timeSpent" INTEGER,
    "workDescription" TEXT,
    "workDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraWorkActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserJiraCredentials_userId_key" ON "UserJiraCredentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonJiraAccount_personId_key" ON "PersonJiraAccount"("personId");

-- CreateIndex
CREATE INDEX "PersonJiraAccount_jiraAccountId_idx" ON "PersonJiraAccount"("jiraAccountId");

-- CreateIndex
CREATE INDEX "PersonJiraAccount_jiraEmail_idx" ON "PersonJiraAccount"("jiraEmail");

-- CreateIndex
CREATE INDEX "JiraWorkActivity_personId_idx" ON "JiraWorkActivity"("personId");

-- CreateIndex
CREATE INDEX "JiraWorkActivity_jiraIssueKey_idx" ON "JiraWorkActivity"("jiraIssueKey");

-- CreateIndex
CREATE INDEX "JiraWorkActivity_workDate_idx" ON "JiraWorkActivity"("workDate");

-- CreateIndex
CREATE UNIQUE INDEX "JiraWorkActivity_personId_jiraIssueId_workDate_key" ON "JiraWorkActivity"("personId", "jiraIssueId", "workDate");

-- AddForeignKey
ALTER TABLE "UserJiraCredentials" ADD CONSTRAINT "UserJiraCredentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonJiraAccount" ADD CONSTRAINT "PersonJiraAccount_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraWorkActivity" ADD CONSTRAINT "JiraWorkActivity_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
