-- AlterTable
ALTER TABLE "NotificationResponse" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "ignoredAt" TIMESTAMP(3),
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OrganizationToleranceRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationToleranceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exception" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "notificationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "acknowledgedAt" TIMESTAMP(3),
    "ignoredAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "ignoredBy" TEXT,
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exception_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationToleranceRule_organizationId_idx" ON "OrganizationToleranceRule"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationToleranceRule_ruleType_idx" ON "OrganizationToleranceRule"("ruleType");

-- CreateIndex
CREATE INDEX "OrganizationToleranceRule_isEnabled_idx" ON "OrganizationToleranceRule"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "Exception_notificationId_key" ON "Exception"("notificationId");

-- CreateIndex
CREATE INDEX "Exception_ruleId_idx" ON "Exception"("ruleId");

-- CreateIndex
CREATE INDEX "Exception_organizationId_idx" ON "Exception"("organizationId");

-- CreateIndex
CREATE INDEX "Exception_entityType_entityId_idx" ON "Exception"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Exception_status_idx" ON "Exception"("status");

-- CreateIndex
CREATE INDEX "Exception_severity_idx" ON "Exception"("severity");

-- CreateIndex
CREATE INDEX "Exception_notificationId_idx" ON "Exception"("notificationId");

-- AddForeignKey
ALTER TABLE "OrganizationToleranceRule" ADD CONSTRAINT "OrganizationToleranceRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exception" ADD CONSTRAINT "Exception_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "OrganizationToleranceRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exception" ADD CONSTRAINT "Exception_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exception" ADD CONSTRAINT "Exception_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
