# Notes and File Attachments

This document explains the notes and file attachment system in ManagerOS.

## Overview

The notes system allows users to attach notes with file attachments to various entities in the system (initiatives, tasks, meetings, people, etc.). Notes provide a way to capture additional context, documentation, and supporting materials.

## Features

### Notes

- **Content**: Rich text notes with markdown support
- **Timestamps**: Automatic creation and update timestamps
- **User Attribution**: Notes are attributed to the user who created them
- **Organization Isolation**: Notes are scoped to the user's organization

### File Attachments

- **Multiple Files**: Each note can have multiple file attachments
- **File Types**: Supports images, PDFs, documents, and text files
- **Size Limits**: Configurable file size limits (default 50MB)
- **Cloud Storage**: Files are stored in Cloudflare R2 with global CDN
- **Security**: Files are organized by entity type and ID for proper access control

## Database Schema

### Note Model

```prisma
model Note {
  id             String   @id @default(cuid())
  entityType     String   // The type of entity (e.g., "Initiative", "Task", "Meeting", "Person")
  entityId       String   // The ID of the entity
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  content        String
  createdById    String
  createdBy      User     @relation(fields: [createdById], references: [id], onDelete: Cascade)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  attachments    FileAttachment[]
}
```

### FileAttachment Model

```prisma
model FileAttachment {
  id             String   @id @default(cuid())
  noteId         String?
  note           Note?    @relation(fields: [noteId], references: [id], onDelete: Cascade)
  entityType     String   // The type of entity (e.g., "Initiative", "Task", "Meeting", "Person")
  entityId       String   // The ID of the entity
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  fileName       String
  originalName   String
  fileSize       Int
  mimeType       String
  r2Key          String   // Cloudflare R2 object key
  r2Url          String   // Public URL for the file
  uploadedById   String
  uploadedBy     User     @relation(fields: [uploadedById], references: [id], onDelete: Cascade)
  createdAt      DateTime @default(now())
}
```

## File Upload System

### R2 Upload Configuration

The system uses Cloudflare R2 for file storage with the following configuration:

```typescript
// Environment variables required
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name
CLOUDFLARE_R2_PUBLIC_URL=https://your-domain.com
```

### File Organization

Files are organized in R2 with the following structure:

```
bucket-name/
└── notes/
    └── initiative/
        └── {entityId}/
            ├── 1703123456789-abc123def456.pdf
            ├── 1703123456790-xyz789ghi012.jpg
            └── ...
```

### Supported File Types

- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX
- **Text**: TXT, MD, CSV
- **Archives**: ZIP, RAR (future)

### File Size Limits

- **Default**: 50MB per file
- **Configurable**: Can be adjusted per entity type
- **Bug Reports**: 10MB limit for GitHub issue attachments

## API Reference

### Server Actions

#### `createNote(formData)`

Creates a new note with optional file attachments.

```typescript
await createNote({
  entityType: 'Initiative',
  entityId: 'init-123',
  content: 'This is a note about the initiative',
  files?: File[] // Optional file attachments
})
```

#### `updateNote(formData)`

Updates an existing note's content.

```typescript
await updateNote({
  id: 'note-123',
  content: 'Updated note content',
})
```

#### `deleteNote(formData)`

Deletes a note and all its attachments.

```typescript
await deleteNote({
  id: 'note-123',
})
```

#### `getNotesForEntity(entityType, entityId)`

Retrieves all notes for a specific entity.

```typescript
const notes = await getNotesForEntity('Initiative', 'init-123')
```

#### `addAttachmentsToNote(formData)`

Adds file attachments to an existing note.

```typescript
await addAttachmentsToNote({
  noteId: 'note-123',
  files: [file1, file2],
})
```

#### `deleteFileAttachment(formData)`

Deletes a specific file attachment.

```typescript
await deleteFileAttachment({
  id: 'attachment-123',
})
```

### Utility Functions

#### `uploadFileToR2(file, options)`

Uploads a single file to Cloudflare R2.

```typescript
const result = await uploadFileToR2(file, {
  entityType: 'Initiative',
  entityId: 'init-123',
  folder: 'notes',
  maxSizeBytes: 50 * 1024 * 1024,
  allowedMimeTypes: ['image/*', 'application/pdf'],
})
```

#### `uploadFilesToR2(files, options)`

Uploads multiple files to Cloudflare R2.

#### `validateFile(file, options)`

Validates a file before upload.

#### `formatFileSize(bytes)`

Formats file size in human-readable format.

#### `getFileIcon(mimeType)`

Returns an appropriate icon for a file type.

## Security

### Access Control

- **Organization Isolation**: Users can only access notes within their organization
- **Entity Scoping**: Notes are tied to specific entities and inherit their access controls
- **User Attribution**: Notes are attributed to the user who created them

### File Security

- **Public URLs**: Files are publicly accessible via direct URLs
- **No Authentication**: Anyone with the URL can view the file
- **Organization Scoping**: Files are organized by organization for proper isolation

## Usage Examples

### Adding Notes to Initiatives

```typescript
// In an initiative detail page
<NotesSection
  entityType="Initiative"
  entityId={initiative.id}
  notes={notes}
/>
```

### Creating Notes Programmatically

```typescript
// Create a note with attachments
const result = await createNote({
  entityType: 'Initiative',
  entityId: initiativeId,
  content: 'Project update: All milestones completed on time',
  files: [progressReport, teamPhoto],
})
```

### File Upload Validation

```typescript
// Validate files before upload
const validationError = validateFile(file, {
  maxSizeBytes: 10 * 1024 * 1024,
  allowedMimeTypes: ['image/*'],
})

if (validationError) {
  throw new Error(validationError)
}
```

## Future Enhancements

### Planned Features

- **Rich Text Editor**: WYSIWYG editor for note content
- **File Preview**: Inline preview for images and PDFs
- **Version History**: Track changes to notes over time
- **Comments**: Threaded discussions on notes
- **Templates**: Predefined note templates for common use cases
- **Search**: Full-text search across notes and attachments
- **Export**: Export notes and attachments as packages

### Integration Opportunities

- **Email Attachments**: Attach files from email
- **Cloud Storage**: Integration with Google Drive, Dropbox
- **OCR**: Extract text from images and PDFs
- **AI Summarization**: Automatic note summarization
- **Workflow Integration**: Notes as part of approval workflows

## Troubleshooting

### Common Issues

#### File Upload Failures

- **Size Limits**: Check file size against configured limits
- **File Types**: Verify file type is in allowed list
- **R2 Configuration**: Ensure all R2 environment variables are set
- **Network Issues**: Check internet connectivity and R2 service status

#### Access Denied Errors

- **Organization Membership**: Verify user belongs to organization
- **Entity Access**: Check user has access to the target entity
- **Permissions**: Ensure user has appropriate role permissions

#### Database Errors

- **Schema Sync**: Run `prisma migrate dev` to sync schema
- **Foreign Keys**: Verify referenced entities exist
- **Constraints**: Check for unique constraint violations

### Performance Optimization

- **File Compression**: Compress images before upload
- **Batch Uploads**: Use `uploadFilesToR2` for multiple files
- **CDN**: Leverage Cloudflare's global CDN for fast file access
- **Caching**: Cache note data for frequently accessed entities
