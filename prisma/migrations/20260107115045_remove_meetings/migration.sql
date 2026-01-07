-- Clean up orphaned data first
-- Delete EntityLinks that reference meetings
DELETE FROM "EntityLink" WHERE "entityType" IN ('Meeting', 'MeetingInstance');

-- Delete Notes that reference meetings
DELETE FROM "Note" WHERE "entityType" = 'Meeting';

-- Delete FileAttachments that reference meetings
DELETE FROM "FileAttachment" WHERE "entityType" = 'Meeting';

-- Delete EntityIntegrationLinks that reference meetings
DELETE FROM "EntityIntegrationLink" WHERE "entityType" IN ('Meeting', 'MeetingInstance');

-- Drop foreign key constraints
ALTER TABLE "MeetingInstanceParticipant" DROP CONSTRAINT IF EXISTS "MeetingInstanceParticipant_meetingInstanceId_fkey";
ALTER TABLE "MeetingInstanceParticipant" DROP CONSTRAINT IF EXISTS "MeetingInstanceParticipant_personId_fkey";
ALTER TABLE "MeetingInstance" DROP CONSTRAINT IF EXISTS "MeetingInstance_meetingId_fkey";
ALTER TABLE "MeetingInstance" DROP CONSTRAINT IF EXISTS "MeetingInstance_organizationId_fkey";
ALTER TABLE "MeetingParticipant" DROP CONSTRAINT IF EXISTS "MeetingParticipant_meetingId_fkey";
ALTER TABLE "MeetingParticipant" DROP CONSTRAINT IF EXISTS "MeetingParticipant_personId_fkey";
ALTER TABLE "Meeting" DROP CONSTRAINT IF EXISTS "Meeting_organizationId_fkey";
ALTER TABLE "Meeting" DROP CONSTRAINT IF EXISTS "Meeting_teamId_fkey";
ALTER TABLE "Meeting" DROP CONSTRAINT IF EXISTS "Meeting_initiativeId_fkey";
ALTER TABLE "Meeting" DROP CONSTRAINT IF EXISTS "Meeting_ownerId_fkey";
ALTER TABLE "Meeting" DROP CONSTRAINT IF EXISTS "Meeting_createdById_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "MeetingInstanceParticipant_meetingInstanceId_idx";
DROP INDEX IF EXISTS "MeetingInstanceParticipant_personId_idx";
DROP INDEX IF EXISTS "MeetingInstanceParticipant_status_idx";
DROP INDEX IF EXISTS "MeetingInstance_meetingId_idx";
DROP INDEX IF EXISTS "MeetingInstance_organizationId_idx";
DROP INDEX IF EXISTS "MeetingInstance_scheduledAt_idx";
DROP INDEX IF EXISTS "MeetingParticipant_meetingId_idx";
DROP INDEX IF EXISTS "MeetingParticipant_personId_idx";
DROP INDEX IF EXISTS "MeetingParticipant_status_idx";
DROP INDEX IF EXISTS "Meeting_organizationId_idx";
DROP INDEX IF EXISTS "Meeting_teamId_idx";
DROP INDEX IF EXISTS "Meeting_initiativeId_idx";
DROP INDEX IF EXISTS "Meeting_ownerId_idx";
DROP INDEX IF EXISTS "Meeting_createdById_idx";
DROP INDEX IF EXISTS "Meeting_scheduledAt_idx";
DROP INDEX IF EXISTS "Meeting_isRecurring_idx";

-- Drop tables in dependency order
DROP TABLE IF EXISTS "MeetingInstanceParticipant";
DROP TABLE IF EXISTS "MeetingInstance";
DROP TABLE IF EXISTS "MeetingParticipant";
DROP TABLE IF EXISTS "Meeting";

