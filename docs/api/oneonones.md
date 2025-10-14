# One-on-Ones API

## Overview

The One-on-Ones API provides functionality for scheduling and managing one-on-one meetings between two people in an organization, typically between a manager and a direct report.

## Security

- All one-on-one operations require authentication
- Users can only access one-on-ones where they are one of the two participants
- One-on-ones are private to the two participants
- Both participants must be in the same organization
- See the [Security Requirements](../../.cursor/rules/security-requirements.mdc) for detailed access control rules

## REST Endpoints

### GET /api/oneonones

Retrieves one-on-ones for the current user.

**Authentication:** Required

**Query Parameters:**

| Parameter          | Type   | Required | Description                                        |
| ------------------ | ------ | -------- | -------------------------------------------------- |
| `page`             | number | No       | Page number (default: 1)                           |
| `limit`            | number | No       | Items per page (default: 20)                       |
| `scheduledFrom`    | string | No       | Filter by start date (ISO 8601)                    |
| `scheduledTo`      | string | No       | Filter by end date (ISO 8601)                      |
| `sort`             | string | No       | Sort fields (e.g., `scheduledAt:desc,manager:asc`) |
| `immutableFilters` | string | No       | JSON string with additional filters                |

**Sort Format:**

Sort parameter accepts comma-separated field:direction pairs:

- `scheduledAt:desc` - Sort by scheduled date descending
- `manager:asc` - Sort by manager name ascending
- `report:desc` - Sort by report name descending

Multiple sorts: `scheduledAt:desc,manager:asc`

**Response:**

```json
{
  "oneOnOnes": [
    {
      "id": "oneonone_123",
      "managerId": "person_456",
      "reportId": "person_789",
      "scheduledAt": "2025-10-20T14:00:00.000Z",
      "notes": "Discuss Q4 goals",
      "createdAt": "2025-10-14T12:00:00.000Z",
      "updatedAt": "2025-10-14T12:00:00.000Z",
      "manager": {
        "id": "person_456",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "user": {
          "id": "user_101"
        }
      },
      "report": {
        "id": "person_789",
        "name": "John Doe",
        "email": "john@example.com",
        "user": {
          "id": "user_102"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 15,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

**Status Codes:**

- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User not in organization or no person record
- `400 Bad Request` - Invalid immutableFilters parameter
- `500 Internal Server Error` - Server error

## Server Actions

### createOneOnOne

Creates a new one-on-one meeting.

**Function Signature:**

```typescript
createOneOnOne(formData: OneOnOneFormData): Promise<void>
```

**Parameters:**

```typescript
interface OneOnOneFormData {
  participant1Id: string // Person ID (typically the manager)
  participant2Id: string // Person ID (typically the report)
  scheduledAt: string // ISO 8601 date-time
  notes?: string // Meeting notes or agenda
}
```

**Returns:** Redirects to one-on-ones list page

**Throws:**

- `Error: "User must belong to an organization"`
- `Error: "Participant 1 not found or not in your organization"`
- `Error: "Participant 2 not found or not in your organization"`

**Example:**

```typescript
import { createOneOnOne } from '@/lib/actions/oneonone'

await createOneOnOne({
  participant1Id: 'person_123', // Manager
  participant2Id: 'person_456', // Report
  scheduledAt: '2025-10-20T14:00:00.000Z',
  notes: 'Quarterly review and goal setting',
})
```

**Note:** The form uses `participant1Id` and `participant2Id` for flexibility, but these are mapped to `managerId` and `reportId` in the database.

---

### updateOneOnOne

Updates an existing one-on-one meeting.

**Function Signature:**

```typescript
updateOneOnOne(id: string, formData: OneOnOneFormData): Promise<void>
```

**Parameters:**

- `id`: One-on-one ID to update
- `formData`: Same as `createOneOnOne`

**Returns:** Redirects to one-on-ones list page

**Throws:**

- `Error: "User must belong to an organization"`
- `Error: "No person record found for current user"`
- `Error: "One-on-one not found or you do not have access to it"`
- `Error: "Participant 1 not found or not in your organization"`
- `Error: "Participant 2 not found or not in your organization"`

**Access Control:** Only participants in the one-on-one can update it.

**Example:**

```typescript
await updateOneOnOne('oneonone_123', {
  participant1Id: 'person_123',
  participant2Id: 'person_456',
  scheduledAt: '2025-10-22T15:00:00.000Z',
  notes: 'Updated: Focus on career development',
})
```

---

### getOneOnOnes

Retrieves all one-on-ones for the current user.

**Function Signature:**

```typescript
getOneOnOnes(): Promise<OneOnOne[]>
```

**Returns:** Array of one-on-one objects

```typescript
interface OneOnOne {
  id: string
  managerId: string
  reportId: string
  scheduledAt: Date
  notes: string | null
  createdAt: Date
  updatedAt: Date
  manager: {
    id: string
    name: string
    email: string | null
    role: string
  }
  report: {
    id: string
    name: string
    email: string | null
    role: string
  }
}
```

**Throws:**

- `Error: "User must belong to an organization"`

**Access Control:** Returns only one-on-ones where the current user's person record is either the manager or the report.

---

### getOneOnOneById

Retrieves a single one-on-one by ID.

**Function Signature:**

```typescript
getOneOnOneById(id: string): Promise<OneOnOne>
```

**Parameters:**

- `id`: One-on-one ID

**Returns:** One-on-one object with participant details

```typescript
interface OneOnOne {
  id: string
  managerId: string
  reportId: string
  scheduledAt: Date
  notes: string | null
  manager: {
    id: string
    name: string
    email: string | null
    role: string
  }
  report: {
    id: string
    name: string
    email: string | null
    role: string
  }
}
```

**Throws:**

- `Error: "User must belong to an organization"`
- `Error: "No person record found for current user"`
- `Error: "One-on-one not found or you do not have access to it"`

**Access Control:** Only returns the one-on-one if the current user is one of the two participants.

**Example:**

```typescript
const oneOnOne = await getOneOnOneById('oneonone_123')
console.log(
  `Meeting between ${oneOnOne.manager.name} and ${oneOnOne.report.name}`
)
```

## Data Model

### Database Schema

One-on-ones are stored with the following structure:

```prisma
model OneOnOne {
  id          String   @id @default(cuid())
  managerId   String   // First participant
  reportId    String   // Second participant
  scheduledAt DateTime
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  manager Person @relation("ManagerOneOnOnes", fields: [managerId])
  report  Person @relation("ReportOneOnOnes", fields: [reportId])
}
```

### Naming Convention

The database uses `managerId` and `reportId` to represent the two participants in a one-on-one:

- `managerId` - Typically the manager or senior person
- `reportId` - Typically the direct report or junior person

The API accepts `participant1Id` and `participant2Id` for more flexibility, which are mapped to these database fields.

## Access Control

One-on-ones follow these strict access rules:

1. **Privacy**: One-on-ones are only visible to the two participants
2. **Organization Scoping**: Both participants must be in the same organization
3. **User-Person Linking**: The current user must have a linked person record to access one-on-ones
4. **Participant Verification**: All operations verify the current user is one of the two participants

### Access Scenarios

**Allowed:**

- ✅ Manager views their one-on-ones with direct reports
- ✅ Report views their one-on-ones with their manager
- ✅ Participants can update the one-on-one

**Not Allowed:**

- ❌ Users without a linked person record cannot access one-on-ones
- ❌ Users cannot see one-on-ones they are not part of
- ❌ Users cannot see one-on-ones for people outside their organization

## Use Cases

### 1. Manager-Report One-on-Ones

Most common use case - regular check-ins between a manager and direct report:

```typescript
await createOneOnOne({
  participant1Id: managerId,
  participant2Id: reportId,
  scheduledAt: '2025-10-20T14:00:00.000Z',
  notes: 'Weekly 1:1 - Career development and blockers',
})
```

### 2. Peer One-on-Ones

Can also be used for peer discussions:

```typescript
await createOneOnOne({
  participant1Id: engineerId,
  participant2Id: designerId,
  scheduledAt: '2025-10-20T15:00:00.000Z',
  notes: 'Design review session',
})
```

### 3. Skip-Level One-on-Ones

For senior leadership to meet with reports of their direct reports:

```typescript
await createOneOnOne({
  participant1Id: seniorManagerId,
  participant2Id: individualContributorId,
  scheduledAt: '2025-10-20T16:00:00.000Z',
  notes: 'Skip-level check-in',
})
```

## Related APIs

- [People API](./people.md) - For managing participants
- [Meetings API](./meetings.md) - For larger group meetings
- [Feedback API](./feedback.md) - For giving feedback after one-on-ones
- [Organizations API](./organizations.md) - For user-person linking

## Best Practices

1. **Regular Scheduling**: Schedule one-on-ones at consistent intervals
2. **Preparation**: Use the notes field to prepare agenda items
3. **Follow-up**: Link to tasks or feedback created during the one-on-one
4. **Privacy**: Remember that one-on-ones are private between the two participants
5. **User Linking**: Ensure users are linked to person records to access one-on-ones
