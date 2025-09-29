-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "jobRoleId" TEXT;

-- CreateTable
CREATE TABLE "JobRole" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLevel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDomain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobRole_organizationId_idx" ON "JobRole"("organizationId");

-- CreateIndex
CREATE INDEX "JobRole_levelId_idx" ON "JobRole"("levelId");

-- CreateIndex
CREATE INDEX "JobRole_domainId_idx" ON "JobRole"("domainId");

-- CreateIndex
CREATE INDEX "JobLevel_organizationId_idx" ON "JobLevel"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "JobLevel_name_organizationId_key" ON "JobLevel"("name", "organizationId");

-- CreateIndex
CREATE INDEX "JobDomain_organizationId_idx" ON "JobDomain"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "JobDomain_name_organizationId_key" ON "JobDomain"("name", "organizationId");

-- CreateIndex
CREATE INDEX "Person_jobRoleId_idx" ON "Person"("jobRoleId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "JobRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "JobLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "JobDomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobLevel" ADD CONSTRAINT "JobLevel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDomain" ADD CONSTRAINT "JobDomain_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
