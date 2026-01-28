-- Remove Notes feature: delete dependent data, drop Note/NoteShare, remove noteId from FileAttachment

-- Delete all NoteShare rows (references Note)
DELETE FROM "NoteShare";

-- Delete FileAttachments that were attached to notes
DELETE FROM "FileAttachment" WHERE "noteId" IS NOT NULL;

-- Drop NoteShare table (has FK to Note)
DROP TABLE "NoteShare";

-- Drop FK from FileAttachment to Note before dropping Note
ALTER TABLE "FileAttachment" DROP CONSTRAINT IF EXISTS "FileAttachment_noteId_fkey";

-- Drop Note table
DROP TABLE "Note";

-- Remove noteId column and its index from FileAttachment
DROP INDEX IF EXISTS "FileAttachment_noteId_idx";
ALTER TABLE "FileAttachment" DROP COLUMN "noteId";
