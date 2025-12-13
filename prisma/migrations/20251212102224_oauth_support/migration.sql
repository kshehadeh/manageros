-- CreateTable
CREATE TABLE "OAuthClientMetadata" (
    "id" TEXT NOT NULL,
    "clerkClientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthClientMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthClientMetadata_clerkClientId_key" ON "OAuthClientMetadata"("clerkClientId");

-- CreateIndex
CREATE INDEX "OAuthClientMetadata_organizationId_idx" ON "OAuthClientMetadata"("organizationId");

-- CreateIndex
CREATE INDEX "OAuthClientMetadata_createdById_idx" ON "OAuthClientMetadata"("createdById");

-- CreateIndex
CREATE INDEX "OAuthClientMetadata_clerkClientId_idx" ON "OAuthClientMetadata"("clerkClientId");

-- AddForeignKey
ALTER TABLE "OAuthClientMetadata" ADD CONSTRAINT "OAuthClientMetadata_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthClientMetadata" ADD CONSTRAINT "OAuthClientMetadata_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
