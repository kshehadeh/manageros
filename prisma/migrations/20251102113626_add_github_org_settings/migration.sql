-- CreateTable
CREATE TABLE "OrganizationGithubOrg" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "githubOrgName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationGithubOrg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationGithubOrg_organizationId_idx" ON "OrganizationGithubOrg"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationGithubOrg_githubOrgName_idx" ON "OrganizationGithubOrg"("githubOrgName");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationGithubOrg_organizationId_githubOrgName_key" ON "OrganizationGithubOrg"("organizationId", "githubOrgName");

-- AddForeignKey
ALTER TABLE "OrganizationGithubOrg" ADD CONSTRAINT "OrganizationGithubOrg_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
