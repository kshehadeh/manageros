-- Clean up orphaned OnboardingItem records with type = 'MEETING'
-- These records reference meetings that no longer exist
DELETE FROM "OnboardingItem" WHERE "type" = 'MEETING';

-- Drop the linkedMeetingId column from OnboardingItem table
ALTER TABLE "OnboardingItem" DROP COLUMN IF EXISTS "linkedMeetingId";

-- Drop the materializedMeetingId column from OnboardingItemProgress table
ALTER TABLE "OnboardingItemProgress" DROP COLUMN IF EXISTS "materializedMeetingId";

-- Remove 'MEETING' from the OnboardingItemType enum
-- First, update any remaining records (should be none after the DELETE above, but just in case)
UPDATE "OnboardingItem" SET "type" = 'TASK' WHERE "type" = 'MEETING';

-- Remove the enum value using ALTER TYPE
-- PostgreSQL doesn't support removing enum values directly, so we need to:
-- 1. Drop the default constraint on the column
-- 2. Create a new enum without MEETING
-- 3. Update the column to use the new enum
-- 4. Re-add the default constraint
-- 5. Drop the old enum
-- 6. Rename the new enum

-- Drop the default constraint
ALTER TABLE "OnboardingItem" ALTER COLUMN "type" DROP DEFAULT;

-- Create new enum without MEETING
CREATE TYPE "OnboardingItemType_new" AS ENUM ('TASK', 'READING', 'CHECKPOINT', 'EXPECTATION');

-- Update the column to use the new enum
ALTER TABLE "OnboardingItem" 
  ALTER COLUMN "type" TYPE "OnboardingItemType_new" 
  USING ("type"::text::"OnboardingItemType_new");

-- Re-add the default constraint with the new enum type
ALTER TABLE "OnboardingItem" ALTER COLUMN "type" SET DEFAULT 'TASK'::"OnboardingItemType_new";

-- Drop the old enum
DROP TYPE "OnboardingItemType";

-- Rename the new enum to the original name
ALTER TYPE "OnboardingItemType_new" RENAME TO "OnboardingItemType";

