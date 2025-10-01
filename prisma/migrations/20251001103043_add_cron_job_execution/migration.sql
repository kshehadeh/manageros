-- CreateTable
CREATE TABLE "CronJobExecution" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notificationsCreated" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CronJobExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CronJobExecution_jobId_idx" ON "CronJobExecution"("jobId");

-- CreateIndex
CREATE INDEX "CronJobExecution_organizationId_idx" ON "CronJobExecution"("organizationId");

-- CreateIndex
CREATE INDEX "CronJobExecution_startedAt_idx" ON "CronJobExecution"("startedAt");

-- CreateIndex
CREATE INDEX "CronJobExecution_status_idx" ON "CronJobExecution"("status");

-- AddForeignKey
ALTER TABLE "CronJobExecution" ADD CONSTRAINT "CronJobExecution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
