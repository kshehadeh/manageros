# Avatar Management

## Overview

The Avatar Management feature allows users to associate avatars with people in the ManagerOS system. Avatars can be uploaded to R2 storage, sourced from linked Jira or GitHub accounts, or displayed as initials when no avatar is set.

## Database Schema

### Person Model

The `Person` model has been extended with an `avatar` field:

```prisma
model Person {
  // ... existing fields ...
  avatar String? // Avatar URL (external URL or R2 storage URL)
  // ... rest of fields ...
}
```

**Migration**: `20251004000000_add_avatar_to_person`

## Features

### 1. Avatar Upload

Users can upload avatar images directly from their computer:

- **File Types**: JPEG, PNG, GIF, WebP
- **Max Size**: 5MB
- **Storage**: Cloudflare R2 (folder: `avatars/person/{personId}/`)
- **Access**: Admin-only

### 2. Linked Account Avatars

Avatars can be sourced from linked accounts:

#### GitHub Avatar
- Automatically generated from GitHub username
- Format: `https://github.com/{username}.png`
- Available when a person has a linked GitHub account

#### Jira Avatar
- Uses Jira account ID
- Available when a person has a linked Jira account

### 3. Initials Fallback

When no avatar is set, the system displays initials:
- First letter of first name + first letter of last name
- Example: "John Doe" → "JD"
- Displayed in a circular badge with neutral background

## Components

### AvatarEditor

**Path**: `src/components/people/avatar-editor.tsx`

A comprehensive avatar management component that provides:
- Current avatar display with initials fallback
- Upload functionality
- Option to use Jira avatar (if linked)
- Option to use GitHub avatar (if linked)
- Remove avatar functionality

**Props**:
```typescript
interface AvatarEditorProps {
  personId?: string           // Person ID (required for upload)
  personName: string          // Name for initials fallback
  currentAvatar?: string | null
  jiraAvatar?: string | null
  githubAvatar?: string | null
  onAvatarChange?: (avatarUrl: string | null) => void
}
```

**Usage**:
```tsx
<AvatarEditor
  personId={person.id}
  personName={person.name}
  currentAvatar={person.avatar}
  jiraAvatar={linkedAvatars?.jiraAvatar}
  githubAvatar={linkedAvatars?.githubAvatar}
  onAvatarChange={(url) => {
    // Handle avatar change
  }}
/>
```

### PersonAvatar

**Path**: `src/components/people/person-avatar.tsx`

A reusable avatar display component used throughout the app:

**Props**:
```typescript
interface PersonAvatarProps {
  name: string                // Name for initials fallback
  avatar?: string | null      // Avatar URL
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}
```

**Usage**:
```tsx
<PersonAvatar 
  name={person.name} 
  avatar={person.avatar} 
  size="md" 
/>
```

## Server Actions

### uploadAvatar

**Path**: `src/lib/actions/avatar.ts`

Uploads an avatar image to R2 storage.

```typescript
async function uploadAvatar(
  formData: FormData, 
  personId: string
): Promise<string>
```

**Security**:
- Requires admin role
- Validates person belongs to user's organization
- Enforces file size and type restrictions

### updatePersonAvatar

**Path**: `src/lib/actions/avatar.ts`

Updates a person's avatar URL in the database.

```typescript
async function updatePersonAvatar(
  personId: string, 
  avatarUrl: string | null
): Promise<{ success: boolean }>
```

**Security**:
- Requires admin role
- Validates person belongs to user's organization

### getLinkedAccountAvatars

**Path**: `src/lib/actions/avatar.ts`

Retrieves avatar URLs from linked Jira and GitHub accounts.

```typescript
async function getLinkedAccountAvatars(
  personId: string
): Promise<{
  jiraAvatar?: string
  githubAvatar?: string
}>
```

**Security**:
- Validates person belongs to user's organization

## Form Integration

The avatar editor is integrated into the Person Edit Form (`src/components/people/person-form.tsx`) in the **Basic Information** section:

```tsx
<div className='card'>
  <h3 className='font-semibold mb-4'>Basic Information</h3>
  <div className='space-y-4'>
    {/* Avatar Editor */}
    <div>
      <label className='block text-sm font-medium mb-2'>Avatar</label>
      <AvatarEditor
        personId={person?.id}
        personName={formData.name || 'New Person'}
        currentAvatar={formData.avatar || null}
        jiraAvatar={linkedAvatars?.jiraAvatar}
        githubAvatar={linkedAvatars?.githubAvatar}
        onAvatarChange={(avatarUrl) => {
          setFormData({ ...formData, avatar: avatarUrl || '' })
        }}
      />
    </div>
    {/* Other fields... */}
  </div>
</div>
```

## Validation

Avatar URLs are validated using Zod schemas:

```typescript
// personSchema and personUpdateSchema
avatar: z.string().url('Valid URL is required').optional().or(z.literal(''))
```

## Access Control

All avatar management operations follow these security rules:

1. **Admin-Only**: Only organization administrators can upload or modify avatars
2. **Organization Isolation**: Users can only manage avatars for people in their organization
3. **Person Validation**: All operations verify the person exists and belongs to the user's organization

## User Experience

### Upload Flow

1. User clicks "Add Avatar" or "Change Avatar"
2. Options panel expands showing:
   - Upload from Computer
   - Use Jira Avatar (if available)
   - Use GitHub Avatar (if available)
3. User selects an option
4. Avatar is uploaded/set and displayed immediately
5. Changes are saved when the form is submitted

### Display Flow

1. If `person.avatar` exists → Display avatar image
2. Else → Display initials in circular badge
3. Initials are generated from person's name

## Error Handling

The avatar editor handles various error scenarios:

- **No Person ID**: Upload disabled with message "Save the person first to upload an avatar"
- **Upload Failures**: Error message displayed below avatar
- **File Type Errors**: Caught by validation with clear error message
- **File Size Errors**: 5MB limit enforced with clear error message

## Best Practices

1. **Performance**: Avatar images should be optimized before upload
2. **Accessibility**: All avatars include alt text with person's name
3. **Fallback**: Always provide initials fallback for better UX
4. **Security**: Avatar URLs are validated and sanitized
5. **Consistency**: Use `PersonAvatar` component throughout the app for consistent display

## Future Enhancements

Potential improvements for future releases:

1. Image cropping/resizing UI before upload
2. Avatar image optimization on upload
3. Support for animated avatars (GIFs)
4. Batch avatar upload for multiple people
5. Avatar history/versioning
6. Integration with additional services (Slack, Microsoft Teams)

## Migration Instructions

To apply the avatar feature to your database:

1. Run the migration:
   ```bash
   bunx prisma migrate dev
   ```

2. Regenerate Prisma client:
   ```bash
   bunx prisma generate
   ```

3. Restart your development server

## Testing Checklist

- [ ] Upload avatar from computer
- [ ] Use Jira avatar (if account linked)
- [ ] Use GitHub avatar (if account linked)
- [ ] Remove avatar
- [ ] Verify initials display correctly
- [ ] Test with different file types
- [ ] Test file size limits
- [ ] Test access control (non-admin cannot upload)
- [ ] Test organization isolation
- [ ] Verify avatar displays throughout app
