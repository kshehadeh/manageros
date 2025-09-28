-- CreateTable
CREATE TABLE "EntityLink" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityLink_entityType_entityId_idx" ON "EntityLink"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "EntityLink_organizationId_idx" ON "EntityLink"("organizationId");

-- CreateIndex
CREATE INDEX "EntityLink_createdById_idx" ON "EntityLink"("createdById");

-- AddForeignKey
ALTER TABLE "EntityLink" ADD CONSTRAINT "EntityLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityLink" ADD CONSTRAINT "EntityLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
