-- CreateEnum
CREATE TYPE "OnboardingItemType" AS ENUM ('TASK', 'READING', 'MEETING', 'CHECKPOINT', 'EXPECTATION');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OnboardingItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'BLOCKED');

-- CreateTable
CREATE TABLE "OnboardingTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "teamId" TEXT,
    "jobRoleId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingPhase" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingItem" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "OnboardingItemType" NOT NULL DEFAULT 'TASK',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "linkedTaskId" TEXT,
    "linkedMeetingId" TEXT,
    "linkedInitiativeId" TEXT,
    "linkedUrl" TEXT,
    "ownerType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingInstance" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "managerId" TEXT,
    "mentorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingItemProgress" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "status" "OnboardingItemStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "notes" TEXT,
    "materializedTaskId" TEXT,
    "materializedMeetingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingItemProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnboardingTemplate_organizationId_idx" ON "OnboardingTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "OnboardingTemplate_teamId_idx" ON "OnboardingTemplate"("teamId");

-- CreateIndex
CREATE INDEX "OnboardingTemplate_jobRoleId_idx" ON "OnboardingTemplate"("jobRoleId");

-- CreateIndex
CREATE INDEX "OnboardingTemplate_isDefault_idx" ON "OnboardingTemplate"("isDefault");

-- CreateIndex
CREATE INDEX "OnboardingTemplate_isActive_idx" ON "OnboardingTemplate"("isActive");

-- CreateIndex
CREATE INDEX "OnboardingPhase_templateId_idx" ON "OnboardingPhase"("templateId");

-- CreateIndex
CREATE INDEX "OnboardingPhase_sortOrder_idx" ON "OnboardingPhase"("sortOrder");

-- CreateIndex
CREATE INDEX "OnboardingItem_phaseId_idx" ON "OnboardingItem"("phaseId");

-- CreateIndex
CREATE INDEX "OnboardingItem_sortOrder_idx" ON "OnboardingItem"("sortOrder");

-- CreateIndex
CREATE INDEX "OnboardingItem_type_idx" ON "OnboardingItem"("type");

-- CreateIndex
CREATE INDEX "OnboardingInstance_organizationId_idx" ON "OnboardingInstance"("organizationId");

-- CreateIndex
CREATE INDEX "OnboardingInstance_personId_idx" ON "OnboardingInstance"("personId");

-- CreateIndex
CREATE INDEX "OnboardingInstance_templateId_idx" ON "OnboardingInstance"("templateId");

-- CreateIndex
CREATE INDEX "OnboardingInstance_status_idx" ON "OnboardingInstance"("status");

-- CreateIndex
CREATE INDEX "OnboardingInstance_managerId_idx" ON "OnboardingInstance"("managerId");

-- CreateIndex
CREATE INDEX "OnboardingInstance_mentorId_idx" ON "OnboardingInstance"("mentorId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingInstance_personId_templateId_key" ON "OnboardingInstance"("personId", "templateId");

-- CreateIndex
CREATE INDEX "OnboardingItemProgress_instanceId_idx" ON "OnboardingItemProgress"("instanceId");

-- CreateIndex
CREATE INDEX "OnboardingItemProgress_itemId_idx" ON "OnboardingItemProgress"("itemId");

-- CreateIndex
CREATE INDEX "OnboardingItemProgress_status_idx" ON "OnboardingItemProgress"("status");

-- CreateIndex
CREATE INDEX "OnboardingItemProgress_completedById_idx" ON "OnboardingItemProgress"("completedById");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingItemProgress_instanceId_itemId_key" ON "OnboardingItemProgress"("instanceId", "itemId");

-- AddForeignKey
ALTER TABLE "OnboardingTemplate" ADD CONSTRAINT "OnboardingTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingTemplate" ADD CONSTRAINT "OnboardingTemplate_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingTemplate" ADD CONSTRAINT "OnboardingTemplate_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "JobRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingPhase" ADD CONSTRAINT "OnboardingPhase_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OnboardingTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingItem" ADD CONSTRAINT "OnboardingItem_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "OnboardingPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingInstance" ADD CONSTRAINT "OnboardingInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OnboardingTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingInstance" ADD CONSTRAINT "OnboardingInstance_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingInstance" ADD CONSTRAINT "OnboardingInstance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingInstance" ADD CONSTRAINT "OnboardingInstance_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingInstance" ADD CONSTRAINT "OnboardingInstance_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingItemProgress" ADD CONSTRAINT "OnboardingItemProgress_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "OnboardingInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingItemProgress" ADD CONSTRAINT "OnboardingItemProgress_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "OnboardingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingItemProgress" ADD CONSTRAINT "OnboardingItemProgress_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
