-- CreateTable
CREATE TABLE "OrganizationInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" DATETIME NOT NULL,
    "acceptedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrganizationInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrganizationInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OrganizationInvitation_organizationId_idx" ON "OrganizationInvitation"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_email_idx" ON "OrganizationInvitation"("email");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_status_idx" ON "OrganizationInvitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvitation_email_organizationId_key" ON "OrganizationInvitation"("email", "organizationId");
