-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "MeetingInstance" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT true;
