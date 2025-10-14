# Organizations API

## Overview

The Organizations API provides functionality for creating and managing organizations, handling user-person linking, managing organization invitations, and administering organization members.

## Security

- Authentication required for all operations
- Most operations require organization admin role
- Users can only access data within their organization
- Invitations are validated and expire after 7 days
- See the [Security Requirements](../../.cursor/rules/security-requirements.mdc) for detailed access control rules

## REST Endpoints

### GET /api/organization/invitations

Retrieves organization invitations (admin only).

**Authentication:** Required (Admin)

**Response:**

```json
{
  "invitations": [
    {
      "id": "inv_123",
      "email": "newuser@example.com",
      "status": "pending",
      "createdAt": "2025-10-14T12:00:00.000Z",
      "updatedAt": "2025-10-14T12:00:00.000Z",
      "expiresAt": "2025-10-21T12:00:00.000Z",
      "acceptedAt": null,
      "invitedBy": {
        "name": "Admin User",
        "email": "admin@example.com"
      }
    }
  ]
}
```

## Server Actions

## Organization Management

### createOrganization

Creates a new organization and assigns the current user as admin.

**Function Signature:**

```typescript
createOrganization(formData: {
  name: string
  slug: string
}): Promise<Organization>
```

**Parameters:**

- `formData.name`: Organization name
- `formData.slug`: Unique organization slug (URL-friendly identifier)

**Returns:** Created organization object

**Throws:**

- `Error: "User already belongs to an organization"`
- `Error: "Organization slug already exists"`

**Example:**

```typescript
import { createOrganization } from '@/lib/actions/organization'

const org = await createOrganization({
  name: 'Acme Corporation',
  slug: 'acme-corp',
})
```

## User-Person Linking (Admin)

### linkUserToPerson

Links a user account to a person record (admin only).

**Function Signature:**

```typescript
linkUserToPerson(userId: string, personId: string): Promise<void>
```

**Parameters:**

- `userId`: User ID to link
- `personId`: Person ID to link to

**Returns:** `void`

**Throws:**

- `Error: "Only organization admins can link users to persons"`
- `Error: "User must belong to an organization to link users to persons"`
- `Error: "Person not found or access denied"`
- `Error: "Person is already linked to a user"`

**Example:**

```typescript
await linkUserToPerson('user_123', 'person_456')
```

---

### unlinkUserFromPerson

Unlinks a user from their person record (admin only).

**Function Signature:**

```typescript
unlinkUserFromPerson(userId: string): Promise<void>
```

**Parameters:**

- `userId`: User ID to unlink

**Returns:** `void`

**Throws:**

- `Error: "Only organization admins can unlink users from persons"`
- `Error: "User must belong to an organization to manage user-person links"`

---

### getAvailableUsersForLinking

Gets users available for linking to persons (admin only).

**Function Signature:**

```typescript
getAvailableUsersForLinking(): Promise<User[]>
```

**Returns:** Array of users not linked to a person

```typescript
interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'USER'
}
```

## User-Person Linking (Self-Service)

### linkSelfToPerson

Allows a user to link themselves to a person record.

**Function Signature:**

```typescript
linkSelfToPerson(personId: string): Promise<void>
```

**Parameters:**

- `personId`: Person ID to link to

**Returns:** `void`

**Throws:**

- `Error: "User must belong to an organization to link to a person"`
- `Error: "You are already linked to a person. Unlink first to link elsewhere."`
- `Error: "Person not found, access denied, or already linked to another user"`

**Example:**

```typescript
await linkSelfToPerson('person_123')
```

---

### unlinkSelfFromPerson

Allows a user to unlink themselves from their person record.

**Function Signature:**

```typescript
unlinkSelfFromPerson(): Promise<void>
```

**Returns:** `void`

**Throws:**

- `Error: "You are not currently linked to any person"`

---

### getAvailablePersonsForSelfLinking

Gets persons available for self-linking.

**Function Signature:**

```typescript
getAvailablePersonsForSelfLinking(): Promise<Person[]>
```

**Returns:** Array of persons not linked to a user

```typescript
interface Person {
  id: string
  name: string
  email: string | null
  role: string
  status: 'active' | 'inactive'
}
```

---

### getCurrentUserWithPerson

Gets the current user with their linked person.

**Function Signature:**

```typescript
getCurrentUserWithPerson(): Promise<{
  user: User
  person: Person | null
}>
```

**Returns:** User and person object

## Organization Invitations

### createOrganizationInvitation

Creates an invitation for a user to join the organization (admin only).

**Function Signature:**

```typescript
createOrganizationInvitation(email: string): Promise<Invitation>
```

**Parameters:**

- `email`: Email address to invite

**Returns:** Created invitation object

**Throws:**

- `Error: "Only organization admins can send invitations"`
- `Error: "User must belong to an organization to send invitations"`
- `Error: "User is already a member of this organization"`
- `Error: "An invitation has already been sent to this email address"`

**Behavior:**

- If a revoked or expired invitation exists, it will be reactivated
- Invitations expire after 7 days
- Lowercases email for consistency

**Example:**

```typescript
const invitation = await createOrganizationInvitation('newuser@example.com')
```

---

### getOrganizationInvitations

Gets all invitations for the organization (admin only).

**Function Signature:**

```typescript
getOrganizationInvitations(): Promise<Invitation[]>
```

**Returns:** Array of invitations with ISO date strings

```typescript
interface Invitation {
  id: string
  email: string
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
  expiresAt: string // ISO 8601
  acceptedAt: string | null // ISO 8601
  invitedBy: {
    name: string
    email: string
  }
}
```

---

### revokeOrganizationInvitation

Revokes a pending invitation (admin only).

**Function Signature:**

```typescript
revokeOrganizationInvitation(invitationId: string): Promise<void>
```

**Parameters:**

- `invitationId`: Invitation ID to revoke

**Returns:** `void`

**Throws:**

- `Error: "Only organization admins can revoke invitations"`
- `Error: "User must belong to an organization to manage invitations"`
- `Error: "Invitation not found or access denied"`
- `Error: "Only pending invitations can be revoked"`

---

### reactivateOrganizationInvitation

Reactivates a revoked or expired invitation (admin only).

**Function Signature:**

```typescript
reactivateOrganizationInvitation(invitationId: string): Promise<void>
```

**Parameters:**

- `invitationId`: Invitation ID to reactivate

**Returns:** `void`

**Throws:**

- `Error: "Only organization admins can reactivate invitations"`
- `Error: "User must belong to an organization to manage invitations"`
- `Error: "Invitation not found or access denied"`
- `Error: "Invitation is already active"`
- `Error: "Cannot reactivate an accepted invitation"`
- `Error: "User is already a member of this organization"`

**Behavior:**

- Sets new expiration date (7 days from now)
- Updates invitedBy to current admin

---

### acceptOrganizationInvitation

Accepts an invitation by email (called during signup).

**Function Signature:**

```typescript
acceptOrganizationInvitation(email: string): Promise<Organization | null>
```

**Parameters:**

- `email`: Email address with pending invitation

**Returns:** Organization object or `null` if no valid invitation

**Note:** Used internally during user signup flow.

---

### checkPendingInvitation

Checks if there's a pending invitation for an email.

**Function Signature:**

```typescript
checkPendingInvitation(email: string): Promise<Invitation | null>
```

**Parameters:**

- `email`: Email to check

**Returns:** Invitation object or `null`

---

### getPendingInvitationsForUser

Gets pending invitations for the current user.

**Function Signature:**

```typescript
getPendingInvitationsForUser(): Promise<Invitation[]>
```

**Returns:** Array of pending invitations

**Note:** Only returns invitations if user doesn't have an organization.

---

### acceptInvitationForUser

Accepts an invitation for the current user.

**Function Signature:**

```typescript
acceptInvitationForUser(invitationId: string): Promise<User>
```

**Parameters:**

- `invitationId`: Invitation ID to accept

**Returns:** Updated user object with organization

**Throws:**

- `Error: "User already belongs to an organization"`
- `Error: "Invitation not found or expired"`

**Example:**

```typescript
const updatedUser = await acceptInvitationForUser('inv_123')
```

## Organization Member Management

### getOrganizationMembers

Gets all members of the organization (admin only).

**Function Signature:**

```typescript
getOrganizationMembers(): Promise<Member[]>
```

**Returns:** Array of organization members

```typescript
interface Member {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'USER'
  createdAt: Date
  person: {
    id: string
    name: string
    role: string
    status: 'active' | 'inactive'
    team: {
      id: string
      name: string
    } | null
  } | null
}
```

**Throws:**

- `Error: "Only organization admins can view organization members"`

---

### updateUserRole

Updates a user's role in the organization (admin only).

**Function Signature:**

```typescript
updateUserRole(
  userId: string,
  newRole: 'ADMIN' | 'USER'
): Promise<void>
```

**Parameters:**

- `userId`: User ID to update
- `newRole`: New role to assign

**Returns:** `void`

**Throws:**

- `Error: "Only organization admins can change user roles"`
- `Error: "User must belong to an organization to manage roles"`
- `Error: "User not found or access denied"`
- `Error: "You cannot change your own role"`
- `Error: "Cannot remove the last admin from the organization"`

**Example:**

```typescript
await updateUserRole('user_123', 'ADMIN')
```

---

### removeUserFromOrganization

Removes a user from the organization (admin only).

**Function Signature:**

```typescript
removeUserFromOrganization(userId: string): Promise<void>
```

**Parameters:**

- `userId`: User ID to remove

**Returns:** `void`

**Throws:**

- `Error: "Only organization admins can remove users from the organization"`
- `Error: "User must belong to an organization to manage members"`
- `Error: "User not found or access denied"`
- `Error: "You cannot remove yourself from the organization"`
- `Error: "Cannot remove the last admin from the organization"`

**Behavior:**

- Unlinks user from person if linked
- Removes user from organization
- Resets user role to 'USER'

**Example:**

```typescript
await removeUserFromOrganization('user_123')
```

## Invitation Workflow

### 1. Admin Invites User

```typescript
// Admin creates invitation
const invitation = await createOrganizationInvitation('newuser@example.com')
// Email sent to newuser@example.com with invitation link
```

### 2. User Signs Up

```typescript
// During signup, system checks for pending invitation
const invitation = await checkPendingInvitation('newuser@example.com')

if (invitation) {
  // Auto-accept invitation and join organization
  const org = await acceptOrganizationInvitation('newuser@example.com')
}
```

### 3. Existing User Accepts Invitation

```typescript
// User sees pending invitations
const invitations = await getPendingInvitationsForUser()

// User accepts invitation
await acceptInvitationForUser(invitations[0].id)
```

## Member Management Workflow

### 1. View All Members

```typescript
const members = await getOrganizationMembers()

members.forEach(member => {
  console.log(`${member.name} (${member.role})`)
  if (member.person) {
    console.log(`  Linked to: ${member.person.name}`)
    console.log(`  Team: ${member.person.team?.name || 'None'}`)
  }
})
```

### 2. Promote to Admin

```typescript
await updateUserRole('user_123', 'ADMIN')
```

### 3. Demote from Admin

```typescript
// Check admin count first
const members = await getOrganizationMembers()
const adminCount = members.filter(m => m.role === 'ADMIN').length

if (adminCount > 1) {
  await updateUserRole('user_123', 'USER')
} else {
  console.log('Cannot remove last admin')
}
```

### 4. Remove Member

```typescript
await removeUserFromOrganization('user_123')
```

## Invitation Status Values

- `pending` - Invitation sent, awaiting acceptance
- `accepted` - User accepted invitation
- `revoked` - Admin revoked invitation
- `expired` - Invitation expired (7 days)

## User Roles

- `ADMIN` - Full access to organization settings and member management
- `USER` - Standard user access

## Access Control

### Admin-Only Operations

The following operations require `ADMIN` role:

- Creating/revoking/reactivating invitations
- Viewing organization members
- Updating user roles
- Removing users from organization
- Linking/unlinking users to persons (admin version)

### User Operations

All authenticated users can:

- Link themselves to available persons
- Unlink themselves from persons
- View pending invitations for their email
- Accept invitations

### Constraints

- Cannot remove the last admin from an organization
- Cannot change your own role
- Cannot remove yourself from the organization
- Invitations expire after 7 days
- Email addresses are lowercased for consistency

## Related APIs

- [People API](./people.md) - For managing person records
- [Authentication APIs](./authentication.md) - For user authentication

## Best Practices

### 1. Invitation Management

```typescript
// Send invitation
const invitation = await createOrganizationInvitation('user@example.com')

// Check status periodically
const invitations = await getOrganizationInvitations()
const pending = invitations.filter(i => i.status === 'pending')

// Reactivate expired invitations
for (const inv of invitations) {
  if (inv.status === 'expired') {
    await reactivateOrganizationInvitation(inv.id)
  }
}
```

### 2. Member Onboarding

```typescript
// 1. Invite user
await createOrganizationInvitation('newuser@example.com')

// 2. User signs up and auto-joins

// 3. Admin links to person
const users = await getAvailableUsersForLinking()
const newUser = users.find(u => u.email === 'newuser@example.com')
await linkUserToPerson(newUser.id, 'person_123')

// 4. Optionally promote to admin
await updateUserRole(newUser.id, 'ADMIN')
```

### 3. Maintain At Least One Admin

```typescript
async function safelyDemoteAdmin(userId: string) {
  const members = await getOrganizationMembers()
  const adminCount = members.filter(m => m.role === 'ADMIN').length

  if (adminCount <= 1) {
    throw new Error('Must have at least one admin. Promote another user first.')
  }

  await updateUserRole(userId, 'USER')
}
```

### 4. Self-Service Person Linking

```typescript
// User finds themselves in the person list
const available = await getAvailablePersonsForSelfLinking()
const myPerson = available.find(p => p.email === currentUser.email)

if (myPerson) {
  await linkSelfToPerson(myPerson.id)
}
```
