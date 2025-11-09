# Permissions System

## Overview

ManagerOS uses a centralized permission system that controls access to all actions in the system. Permissions are checked at the server level to ensure security and are based on user roles, organization membership, and entity ownership/participation.

## User Roles

The system has two user roles:

- **ADMIN**: Organization administrators with elevated permissions
- **USER**: Standard users with limited permissions

## Permission Structure

Permissions follow a hierarchical naming pattern: `{entity}.{action}`

For example:

- `task.create` - Permission to create tasks
- `meeting.edit` - Permission to edit meetings
- `feedback.delete` - Permission to delete feedback

## Permission Types

### 1. General Permissions

These permissions don't require an entity ID and check general capabilities:

- `task.create` - Create tasks (requires ADMIN role OR linked person)
- `task.view` - View tasks (requires organization membership)
- `meeting.create` - Create meetings (requires linked person)
- `meeting.view` - View meetings (requires organization membership)
- `initiative.create` - Create initiatives (requires ADMIN role OR linked person)
- `initiative.view` - View initiatives (requires organization membership)
- `report.access` - Access reports (requires ADMIN role)
- `report.view` - View reports (requires organization membership)
- `feedback.create` - Create feedback (requires ADMIN role OR linked person)
- `feedback.view` - View feedback (requires organization membership)
- `oneonone.create` - Create one-on-ones (requires ADMIN role OR linked person)
- `feedback-campaign.create` - Create feedback campaigns (requires ADMIN role OR linked person)
- `user.link-person` - Link users to persons (requires ADMIN role)

### 2. ID-Based Permissions

These permissions require an entity ID to check specific access based on ownership or participation:

- `task.edit` - Edit a specific task (must be creator OR assignee)
- `task.delete` - Delete a specific task (must be creator OR assignee)
- `meeting.edit` - Edit a specific meeting (must be creator, owner, OR participant; ADMIN can edit any)
- `meeting.delete` - Delete a specific meeting (must be creator OR owner; ADMIN can delete any)
- `feedback.edit` - Edit a specific feedback (must be creator; ADMIN can edit any)
- `feedback.delete` - Delete a specific feedback (must be creator; ADMIN can delete any)
- `oneonone.edit` - Edit a specific one-on-one (must be participant; ADMIN can edit any)
- `oneonone.delete` - Delete a specific one-on-one (must be participant; ADMIN can delete any)
- `oneonone.view` - View a specific one-on-one (must be participant; ADMIN can view any)
- `feedback-campaign.edit` - Edit a specific feedback campaign (must be creator; ADMIN can edit any)
- `feedback-campaign.delete` - Delete a specific feedback campaign (must be creator; ADMIN can delete any)
- `feedback-campaign.view` - View a specific feedback campaign (must be creator; ADMIN can view any)

### 3. Admin-Only Permissions

These permissions are restricted to ADMIN users:

- `initiative.edit` - Edit initiatives (ADMIN only)
- `initiative.delete` - Delete initiatives (ADMIN only)
- `report.create` - Create reports (ADMIN only)
- `report.edit` - Edit reports (ADMIN only)
- `report.delete` - Delete reports (ADMIN only)
- `user.link-person` - Link users to persons (ADMIN only)

## Permission Requirements

### Organization Membership

Most permissions require the user to belong to an organization (`user.organizationId` must be set). Without organization membership, users have very limited access.

### Person Linking

Some permissions require the user to be linked to a person record (`user.personId` must be set):

- `task.create` - Requires linked person (unless ADMIN)
- `meeting.create` - Requires linked person
- `initiative.create` - Requires linked person (unless ADMIN)
- `feedback.create` - Requires linked person (unless ADMIN)
- `oneonone.create` - Requires linked person (unless ADMIN)
- `feedback-campaign.create` - Requires linked person (unless ADMIN)

ID-based permissions for these entities also require a linked person (unless ADMIN).

## Permission Checking

### Using `getActionPermission()`

The central function for checking permissions is `getActionPermission()` in `src/lib/auth-utils.ts`:

```typescript
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'

// Get current user
const user = await getCurrentUser()

// Check general permission
const canCreate = await getActionPermission(user, 'task.create')

// Check ID-based permission
const canEdit = await getActionPermission(user, 'task.edit', taskId)
```

### Single Entity Retrieval Pattern

For functions that retrieve a single entity instance by ID, use the centralized permission pattern:

1. **First check permission** using `getActionPermission` with the entity ID
2. **Then query by ID only** - Remove all user/organization restrictions from the query
3. **Centralize logic** - This ensures all permission logic is in one place

**Example:**

```typescript
export async function getTask(taskId: string) {
  const user = await getCurrentUser()

  // Check permission first
  const hasPermission = await getActionPermission(user, 'task.view', taskId)

  if (!hasPermission) {
    throw new Error('You do not have permission to view this task')
  }

  // Simple query by ID - no user/organization restrictions
  const task = await prisma.task.findFirst({
    where: { id: taskId },
    include: {
      assignee: true,
      initiative: true,
      // ... other relations
    },
  })

  return task
}
```

**Why this pattern?**

- **Centralized permissions**: All permission logic lives in `getActionPermission`
- **Easier maintenance**: Update permissions in one place instead of multiple queries
- **Consistency**: All single entity retrievals follow the same pattern
- **Security**: Permission checks happen before data access

**Note**: This pattern applies only to single entity retrievals. For list queries, continue to filter by `organizationId` and other restrictions in the query itself, as checking permissions on every item would be too expensive.

### Permission Map

All permissions are defined in the `PermissionMap` object in `src/lib/auth-utils.ts`. Each permission has a check function that:

1. Verifies user authentication and organization membership
2. Checks role-based access (ADMIN vs USER)
3. For ID-based permissions, verifies ownership/participation
4. Returns `true` if access is granted, `false` otherwise

## Permission Details by Entity

### Tasks

- **Create**: ADMIN or users with linked person
- **View**: All organization members
- **Edit**: Creator OR assignee (ADMIN can edit any)
- **Delete**: Creator OR assignee (ADMIN can delete any)

### Meetings

- **Create**: Users with linked person
- **View**: All organization members
- **Edit**: Creator, owner, OR participant (ADMIN can edit any)
- **Delete**: Creator OR owner (ADMIN can delete any)

### Initiatives

- **Create**: ADMIN or users with linked person
- **View**: All organization members
- **Edit**: ADMIN only
- **Delete**: ADMIN only

### Reports

- **Access**: ADMIN only
- **View**: All organization members
- **Create**: ADMIN only
- **Edit**: ADMIN only
- **Delete**: ADMIN only

### Feedback

- **Create**: ADMIN or users with linked person
- **View**: All organization members (subject to privacy rules)
- **Edit**: Creator only (ADMIN can edit any)
- **Delete**: Creator only (ADMIN can delete any)

### One-on-Ones

- **Create**: ADMIN or users with linked person
- **View**: Participants only (ADMIN can view any)
- **Edit**: Participants only (ADMIN can edit any)
- **Delete**: Participants only (ADMIN can delete any)

### Feedback Campaigns

- **Create**: ADMIN or users with linked person
- **View**: Creator only (ADMIN can view any)
- **Edit**: Creator only (ADMIN can edit any)
- **Delete**: Creator only (ADMIN can delete any)

### User Management

- **Link Person**: ADMIN only

## Viewing Your Permissions

Users can view their current permissions by navigating to **Settings → Permissions**. This page shows:

- All available permissions in the system
- Whether you have access to each permission
- Which permissions require an ID parameter (marked with ~)
- Permissions grouped by category

## Implementation Notes

### Server-Side Enforcement

All permission checks must be performed on the server side. Client-side checks are for UI purposes only and should never be relied upon for security.

### Single Entity Retrieval Pattern

When implementing functions that retrieve a single entity by ID:

1. **Use `getActionPermission` first** - Check permission before querying
2. **Query by ID only** - Remove user/organization restrictions from the query
3. **Centralize logic** - All permission checks go through `getActionPermission`

This pattern ensures:

- Permission logic is centralized in one place
- Easier to maintain and update access rules
- Consistent security model across all entity retrievals

**Functions using this pattern:**

- `getTask()`
- `getInitiativeById()`
- `getOneOnOneById()`
- `getFeedbackById()`
- `getMeeting()`
- `getMeetingInstance()`
- `getFeedbackCampaignById()`

**Functions that don't use this pattern (list queries):**

- `getAllTasksForInitiative()` - Filters by organization in query
- `getMeetingsForInitiative()` - Filters by organization in query
- `getFeedbackForPerson()` - Filters by organization in query

### Organization Isolation

All permission checks automatically enforce organization boundaries. Users can only access data from their own organization. For single entity retrievals, this is enforced through `getActionPermission`. For list queries, this is enforced through `organizationId` filters in the query.

### Error Handling

When a permission check fails, appropriate error messages should be returned:

- `"User must belong to an organization to [action]"`
- `"[Entity] not found or access denied"`
- `"You do not have permission to [action]"`

### Adding New Permissions

To add a new permission:

1. Add the permission to `ALL_PERMISSIONS` in `src/lib/actions/permissions.ts`
2. Add the permission check function to `PermissionMap` in `src/lib/auth-utils.ts`
3. If the permission requires an ID, add it to `PERMISSIONS_REQUIRING_ID` in `src/lib/actions/permissions.ts`
4. Update this documentation

## Security Considerations

1. **Always check permissions server-side** - Never trust client-side permission checks
2. **Use centralized permission checks** - For single entity retrievals, use `getActionPermission` before querying
3. **Verify organization membership** - All list queries must filter by `organizationId`; single entity retrievals enforce this through `getActionPermission`
4. **Check entity ownership** - For ID-based permissions, verify the user owns or participates in the entity
5. **Use parameterized queries** - Prevent SQL injection by using Prisma's query builder
6. **Log access attempts** - Consider logging failed permission checks for security monitoring

## Related Documentation

- [Security Requirements](../.cursor/rules/security-requirements.mdc) - Detailed security and access control rules
- [Permissions Rules](../.cursor/rules/permissions.mdc) - Concepts and relationships
- [API Documentation](./api/) - API endpoints and their permission requirements
