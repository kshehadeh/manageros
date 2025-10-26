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

### PersonAvatarEditDialog

**Path**: `src/components/people/person-avatar-edit-dialog.tsx`

A dialog-based avatar management component that provides:

- Current avatar display with initials fallback
- Upload functionality
- Option to use Jira avatar (if linked)
- Option to use GitHub avatar (if linked)
- Remove avatar functionality

**Props**:

```typescript
interface PersonAvatarEditDialogProps {
  personId: string // Person ID (required for upload)
  personName: string // Name for initials fallback
  currentAvatar?: string | null
  jiraAvatar?: string | null
  githubAvatar?: string | null
  isOpen: boolean // Dialog open state
  onOpenChange: (open: boolean) => void
  onAvatarChange?: (avatarUrl: string | null) => void
}
```

**Usage**:

```tsx
<PersonAvatarEditDialog
  personId={person.id}
  personName={person.name}
  currentAvatar={person.avatar}
  jiraAvatar={linkedAvatars?.jiraAvatar}
  githubAvatar={linkedAvatars?.githubAvatar}
  isOpen={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  onAvatarChange={url => {
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
  name: string // Name for initials fallback
  avatar?: string | null // Avatar URL
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}
```

**Usage**:

```tsx
<PersonAvatar name={person.name} avatar={person.avatar} size='md' />
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
async function getLinkedAccountAvatars(personId: string): Promise<{
  jiraAvatar?: string
  githubAvatar?: string
}>
```

**Security**:

- Validates person belongs to user's organization

## Form Integration

The avatar editor is integrated into the Person Edit Form (`src/components/people/person-form.tsx`) in the **Basic Information** section. A clickable avatar and button open the `PersonAvatarEditDialog`:

```tsx
;<div className='space-y-4'>
  {/* Avatar Section - Only show when editing existing person */}
  {person && (
    <div className='space-y-2'>
      <Label>Avatar</Label>
      <div className='flex items-center gap-4'>
        <PersonAvatar
          name={formData.name || person.name}
          avatar={formData.avatar || person.avatar}
          size='lg'
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setIsAvatarDialogOpen(true)}
        >
          <ImageIcon className='h-4 w-4 mr-2' />
          {formData.avatar ? 'Change Avatar' : 'Add Avatar'}
        </Button>
      </div>
    </div>
  )}
  {/* Other fields... */}
</div>

{
  /* Avatar Edit Dialog */
}
{
  person && (
    <PersonAvatarEditDialog
      personId={person.id}
      personName={formData.name || person.name}
      currentAvatar={formData.avatar || person.avatar}
      jiraAvatar={linkedAvatars?.jiraAvatar}
      githubAvatar={linkedAvatars?.githubAvatar}
      isOpen={isAvatarDialogOpen}
      onOpenChange={setIsAvatarDialogOpen}
      onAvatarChange={avatarUrl => {
        setFormData(prev => ({ ...prev, avatar: avatarUrl || '' }))
      }}
    />
  )
}
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
