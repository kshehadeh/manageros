# People API

## Overview

The People API provides functionality for managing people within an organization. People represent individuals in the organization hierarchy, including their roles, teams, managers, and direct reports.

## Security

- All people operations require authentication
- People are scoped to the user's organization
- Only organization admins can create, update, or delete people
- All users in an organization can view people in their organization
- See the [Security Requirements](../../.cursor/rules/security-requirements.mdc) for detailed access control rules

## REST Endpoints

### GET /api/people

Retrieves all people in the current user's organization.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type   | Required | Description                             |
| --------- | ------ | -------- | --------------------------------------- |
| `search`  | string | No       | Search in person names and emails       |
| `teamId`  | string | No       | Filter by team ID                       |
| `status`  | string | No       | Filter by status (`active`, `inactive`) |
| `role`    | string | No       | Filter by role                          |

**Response:**

```json
{
  "people": [
    {
      "id": "person_123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Software Engineer",
      "status": "active",
      "birthday": "1990-05-15T00:00:00.000Z",
      "avatar": "https://...",
      "employeeType": "full-time",
      "startedAt": "2023-01-15T00:00:00.000Z",
      "createdAt": "2025-10-01T12:00:00.000Z",
      "updatedAt": "2025-10-14T12:00:00.000Z",
      "team": {
        "id": "team_456",
        "name": "Engineering"
      },
      "manager": {
        "id": "person_789",
        "name": "Jane Smith"
      },
      "jobRole": {
        "id": "role_101",
        "title": "Senior Engineer",
        "level": {
          "id": "level_102",
          "name": "L5",
          "order": 5
        },
        "domain": {
          "id": "domain_103",
          "name": "Engineering"
        }
      },
      "reports": [
        {
          "id": "person_999",
          "name": "Bob Johnson"
        }
      ],
      "_count": {
        "reports": 3,
        "oneOnOnes": 5,
        "feedback": 12
      }
    }
  ]
}
```

**Status Codes:**

- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User not in organization
- `500 Internal Server Error` - Server error

### GET /api/people/names

Retrieves simplified list of people (id and name only) for dropdowns and selections.

**Authentication:** Required

**Response:**

```json
{
  "people": [
    {
      "id": "person_123",
      "name": "John Doe"
    },
    {
      "id": "person_456",
      "name": "Jane Smith"
    }
  ]
}
```

## Server Actions

### createPerson

Creates a new person (admin only).

**Function Signature:**

```typescript
createPerson(formData: PersonFormData): Promise<void>
```

**Parameters:**

```typescript
interface PersonFormData {
  name: string // Required
  email?: string // Optional
  role: string // Job title
  status: 'active' | 'inactive' // Employment status
  birthday?: string // ISO 8601 date string
  avatar?: string // Avatar URL
  employeeType?: string // e.g., 'full-time', 'contract'
  teamId?: string // Team ID
  managerId?: string // Manager's person ID
  jobRoleId?: string // Job role ID
  startedAt?: string // Start date (ISO 8601)
}
```

**Returns:** Redirects to people list page

**Throws:**

- `Error: "Only organization admins can create people"`
- `Error: "User must belong to an organization to create people"`
- `Error: "Team not found or access denied"`
- `Error: "Manager not found or access denied"`
- `Error: "Job role not found or access denied"`

**Example:**

```typescript
import { createPerson } from '@/lib/actions/person'

await createPerson({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Software Engineer',
  status: 'active',
  teamId: 'team_123',
  managerId: 'person_456',
  startedAt: '2025-10-01',
})
```

---

### updatePerson

Updates an existing person (admin only).

**Function Signature:**

```typescript
updatePerson(id: string, formData: PersonFormData): Promise<void>
```

**Parameters:**

- `id`: Person ID to update
- `formData`: Same as `createPerson`

**Returns:** Redirects to person detail page

**Throws:**

- `Error: "Only organization admins can update people"`
- `Error: "User must belong to an organization to update people"`
- `Error: "Person not found or access denied"`
- `Error: "Team not found or access denied"`
- `Error: "Manager not found or access denied"`
- `Error: "Job role not found or access denied"`

---

### updatePersonPartial

Updates specific fields of a person without requiring all fields (admin only).

**Function Signature:**

```typescript
updatePersonPartial(id: string, updateData: PersonUpdateData): Promise<void>
```

**Parameters:**

```typescript
interface PersonUpdateData {
  name?: string
  email?: string
  role?: string
  status?: 'active' | 'inactive'
  birthday?: string
  avatar?: string
  employeeType?: string
  teamId?: string
  managerId?: string
  jobRoleId?: string
  startedAt?: string
}
```

**Returns:** `void`

**Throws:**

- `Error: "Only organization admins can update people"`
- `Error: "User must belong to an organization to update people"`
- `Error: "Person not found or access denied"`

**Example:**

```typescript
await updatePersonPartial('person_123', {
  status: 'inactive',
  teamId: 'team_456',
})
```

---

### deletePerson

Deletes a person (admin only).

**Function Signature:**

```typescript
deletePerson(id: string): Promise<void>
```

**Parameters:**

- `id`: Person ID to delete

**Returns:** Redirects to people list page

**Throws:**

- `Error: "Only organization admins can delete people"`
- `Error: "User must belong to an organization to delete people"`
- `Error: "Person not found or access denied"`
- `Error: "Cannot delete person with direct reports. Please reassign their reports first."`

---

### getPerson

Retrieves a single person by ID.

**Function Signature:**

```typescript
getPerson(id: string): Promise<Person | null>
```

**Parameters:**

- `id`: Person ID

**Returns:** Person object or `null` if not found

```typescript
interface Person {
  id: string
  name: string
  email: string | null
  role: string
  status: 'active' | 'inactive'
  birthday: Date | null
  avatar: string | null
  employeeType: string | null
  startedAt: Date | null
  createdAt: Date
  updatedAt: Date
  team: Team | null
  manager: Person | null
  reports: Person[]
  user: {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'USER'
  } | null
}
```

---

### getPeopleHierarchy

Retrieves all people with hierarchical structure showing reporting relationships.

**Function Signature:**

```typescript
getPeopleHierarchy(): Promise<PeopleHierarchy[]>
```

**Returns:** Array of people with level information

```typescript
interface PeopleHierarchy extends Person {
  level: number // Depth in hierarchy (0 for top-level)
}
```

**Example:**

```typescript
const hierarchy = await getPeopleHierarchy()
// Returns people ordered by hierarchy with level indicating depth
// Level 0: Top-level (no manager)
// Level 1: Direct reports of level 0
// Level 2: Reports of level 1, etc.
```

---

### getDirectReports

Gets direct reports for the current user's linked person.

**Function Signature:**

```typescript
getDirectReports(): Promise<PersonWithRelations[]>
```

**Returns:** Array of direct reports with full details

**Throws:**

- Returns empty array if user has no linked person or no organization

**Example:**

```typescript
const reports = await getDirectReports()
// Returns all active people who report to the current user
```

## Person Status Values

- `active` - Currently employed
- `inactive` - No longer with the organization

## Person Employee Types

Common values (not enforced, can be customized):

- `full-time` - Full-time employee
- `part-time` - Part-time employee
- `contract` - Contractor
- `intern` - Intern
- `consultant` - Consultant

## Access Control

People follow these access rules:

1. All users can view people in their organization
2. Only organization admins can create, update, or delete people
3. People cannot be deleted if they have direct reports
4. Manager relationships must be within the same organization
5. Team assignments must be within the same organization

## Related APIs

- [Teams API](./teams.md) - For managing person teams
- [Organizations API](./organizations.md) - For user-person linking
- [One-on-Ones API](./oneonones.md) - For meetings with direct reports
- [Feedback API](./feedback.md) - For giving/receiving feedback
