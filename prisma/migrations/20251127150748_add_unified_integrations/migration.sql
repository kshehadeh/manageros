-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "integrationType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'organization',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "encryptedCredentials" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityIntegrationLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "externalEntityId" TEXT NOT NULL,
    "externalEntityUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityIntegrationLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Integration_organizationId_integrationType_idx" ON "Integration"("organizationId", "integrationType");

-- CreateIndex
CREATE INDEX "Integration_userId_integrationType_idx" ON "Integration"("userId", "integrationType");

-- CreateIndex
CREATE INDEX "Integration_organizationId_idx" ON "Integration"("organizationId");

-- CreateIndex
CREATE INDEX "Integration_userId_idx" ON "Integration"("userId");

-- CreateIndex
CREATE INDEX "Integration_scope_idx" ON "Integration"("scope");

-- CreateIndex
CREATE INDEX "EntityIntegrationLink_entityType_entityId_idx" ON "EntityIntegrationLink"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "EntityIntegrationLink_integrationId_idx" ON "EntityIntegrationLink"("integrationId");

-- CreateIndex
CREATE INDEX "EntityIntegrationLink_organizationId_idx" ON "EntityIntegrationLink"("organizationId");

-- CreateIndex
CREATE INDEX "EntityIntegrationLink_externalEntityId_idx" ON "EntityIntegrationLink"("externalEntityId");

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityIntegrationLink" ADD CONSTRAINT "EntityIntegrationLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityIntegrationLink" ADD CONSTRAINT "EntityIntegrationLink_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
