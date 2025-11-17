/*
  Warnings:

  - You are about to drop the column `name` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Organization` table. All the data in the column will be lost.
  - Made the column `clerkOrganizationId` on table `Organization` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Organization_slug_key";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "name",
DROP COLUMN "slug",
ALTER COLUMN "clerkOrganizationId" SET NOT NULL;
