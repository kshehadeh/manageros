/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Report` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_organizationId_fkey";

-- DropIndex
DROP INDEX "Report_organizationId_idx";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "organizationId";
