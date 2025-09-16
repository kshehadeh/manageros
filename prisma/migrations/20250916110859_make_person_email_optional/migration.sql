-- DropIndex
DROP INDEX "Person_email_organizationId_key";

-- AlterTable
ALTER TABLE "Person" ALTER COLUMN "email" DROP NOT NULL;
