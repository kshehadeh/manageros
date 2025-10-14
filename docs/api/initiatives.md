# Initiatives API

## Overview

The Initiatives API provides functionality for managing strategic initiatives within an organization. Initiatives represent major projects or goals with objectives, owners, and associated tasks.

## Security

- All initiative operations require authentication
- Initiatives are scoped to the user's organization
- All users in an organization can view initiatives
- Initiatives can be linked to teams, owned by multiple people, and have objectives
- See the [Security Requirements](../../.cursor/rules/security-requirements.mdc) for detailed access control rules

## REST Endpoints

### GET /api/initiatives

Retrieves all initiatives in the current user's organization.

**Authentication:** Required

**Query Parameters:**

| Parameter | Type   | Required | Description                                                                       |
| --------- | ------ | -------- | --------------------------------------------------------------------------------- |
| `status`  | string | No       | Filter by status (`planning`, `in_progress`, `on_hold`, `completed`, `cancelled`) |
| `teamId`  | string | No       | Filter by team ID                                                                 |
| `ownerId` | string | No       | Filter by owner person ID                                                         |
| `rag`     | string | No       | Filter by RAG status (`red`, `amber`, `green`)                                    |

**Response:**

```json
{
  "initiatives": [
    {
      "id": "init_123",
      "title": "Q4 Platform Improvements",
      "summary": "Major platform upgrades for scalability",
      "outcome": "Reduce latency by 50%",
      "startDate": "2025-10-01T00:00:00.000Z",
      "targetDate": "2025-12-31T00:00:00.000Z",
      "status": "in_progress",
      "rag": "green",
      "confidence": 8,
      "createdAt": "2025-10-01T12:00:00.000Z",
      "updatedAt": "2025-10-14T12:00:00.000Z",
      "team": {
        "id": "team_456",
        "name": "Engineering"
      },
      "objectives": [
        {
          "id": "obj_789",
          "title": "Improve database performance",
          "keyResult": "Query time < 100ms",
          "sortIndex": 0
        }
      ],
      "owners": [
        {
          "personId": "person_101",
          "role": "owner",
          "person": {
            "id": "person_101",
            "name": "Jane Smith"
          }
        }
      ]
    }
  ]
}
```

**Status Codes:**

- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User not in organization
- `500 Internal Server Error` - Server error

## Server Actions

### createInitiative

Creates a new initiative.

**Function Signature:**

```typescript
createInitiative(formData: InitiativeFormData): Promise<void>
```

**Parameters:**

```typescript
interface InitiativeFormData {
  title: string // Required
  summary: string // Brief description
  outcome?: string // Expected outcome
  startDate?: string // ISO 8601 date
  targetDate?: string // ISO 8601 date
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  rag: 'red' | 'amber' | 'green' // RAG status
  confidence?: number // 1-10 scale
  teamId?: string // Team ID
  objectives?: Array<{
    title: string
    keyResult?: string
  }>
  owners?: Array<{
    personId: string
    role: string // e.g., 'owner', 'lead'
  }>
}
```

**Returns:** Redirects to the created initiative page

**Throws:**

- `Error: "User must belong to an organization to create initiatives"`
- `Error: "Team not found or access denied"`
- `Error: "One or more selected owners are invalid or do not belong to your organization"`
- `Error: "An initiative with this title already exists. Please choose a different title."` (P2002)
- `Error: "One or more selected team members or teams are invalid. Please check your selections and try again."` (P2003)

**Example:**

```typescript
import { createInitiative } from '@/lib/actions/initiative'

await createInitiative({
  title: 'Q4 Platform Improvements',
  summary: 'Major platform upgrades',
  outcome: 'Reduce latency by 50%',
  status: 'planning',
  rag: 'green',
  confidence: 8,
  teamId: 'team_123',
  objectives: [
    {
      title: 'Improve database performance',
      keyResult: 'Query time < 100ms',
    },
    {
      title: 'Optimize API endpoints',
      keyResult: '95% of requests < 200ms',
    },
  ],
  owners: [
    { personId: 'person_456', role: 'owner' },
    { personId: 'person_789', role: 'tech lead' },
  ],
})
```

---

### updateInitiative

Updates an existing initiative.

**Function Signature:**

```typescript
updateInitiative(id: string, formData: InitiativeFormData): Promise<void>
```

**Parameters:**

- `id`: Initiative ID to update
- `formData`: Same as `createInitiative`

**Returns:** Redirects to the updated initiative page

**Throws:**

- `Error: "User must belong to an organization to update initiatives"`
- `Error: "Initiative not found or access denied"`
- `Error: "Team not found or access denied"`

**Note:** This operation replaces all objectives and owners. Existing ones are deleted and new ones are created.

---

### deleteInitiative

Deletes an initiative.

**Function Signature:**

```typescript
deleteInitiative(id: string): Promise<void>
```

**Parameters:**

- `id`: Initiative ID to delete

**Returns:** `void`

**Throws:**

- `Error: "User must belong to an organization to delete initiatives"`
- `Error: "Initiative not found or access denied"`

**Note:** Deletes cascade to objectives, owners, and check-ins.

---

### createObjective

Creates a new objective for an initiative.

**Function Signature:**

```typescript
createObjective(
  initiativeId: string,
  title: string,
  keyResult?: string
): Promise<Objective>
```

**Parameters:**

- `initiativeId`: Initiative ID
- `title`: Objective title (max 200 characters)
- `keyResult`: Optional key result metric

**Returns:** Created objective object

**Throws:**

- `Error: "User must belong to an organization to create objectives"`
- `Error: "Objective title is required"`
- `Error: "Title must be less than 200 characters"`
- `Error: "Initiative not found or access denied"`

**Example:**

```typescript
const objective = await createObjective(
  'init_123',
  'Implement caching layer',
  'Redis cache with 90% hit rate'
)
```

---

### updateInitiativeTeam

Updates the team associated with an initiative.

**Function Signature:**

```typescript
updateInitiativeTeam(
  initiativeId: string,
  teamId: string | null
): Promise<Initiative>
```

**Parameters:**

- `initiativeId`: Initiative ID
- `teamId`: Team ID to assign, or `null` to remove team

**Returns:** Updated initiative object

**Throws:**

- `Error: "User must belong to an organization to update initiatives"`
- `Error: "Initiative not found or access denied"`
- `Error: "Team not found or access denied"`

---

### addInitiativeOwner

Adds an owner to an initiative.

**Function Signature:**

```typescript
addInitiativeOwner(
  initiativeId: string,
  personId: string,
  role?: string
): Promise<InitiativeOwner>
```

**Parameters:**

- `initiativeId`: Initiative ID
- `personId`: Person ID to add as owner
- `role`: Owner role (default: 'owner')

**Returns:** Created initiative owner object

**Throws:**

- `Error: "User must belong to an organization to manage initiative owners"`
- `Error: "Initiative not found or access denied"`
- `Error: "Person not found or access denied"`
- `Error: "This person is already an owner of this initiative"`

**Example:**

```typescript
await addInitiativeOwner('init_123', 'person_456', 'tech lead')
```

---

### removeInitiativeOwner

Removes an owner from an initiative.

**Function Signature:**

```typescript
removeInitiativeOwner(
  initiativeId: string,
  personId: string
): Promise<void>
```

**Parameters:**

- `initiativeId`: Initiative ID
- `personId`: Person ID to remove

**Returns:** `void`

**Throws:**

- `Error: "User must belong to an organization to manage initiative owners"`
- `Error: "Initiative not found or access denied"`

## Initiative Status Values

- `planning` - Initiative is in planning phase
- `in_progress` - Initiative is actively being worked on
- `on_hold` - Initiative is temporarily paused
- `completed` - Initiative is finished
- `cancelled` - Initiative was cancelled

## RAG Status Values

RAG (Red, Amber, Green) indicates the health of the initiative:

- `red` - At risk, needs immediate attention
- `amber` - Some concerns, monitoring required
- `green` - On track, no major issues

## Confidence Levels

Confidence is represented as a number from 1 to 10:

- `1-3` - Low confidence
- `4-6` - Medium confidence
- `7-9` - High confidence
- `10` - Very high confidence

## Data Model

### Initiative

```typescript
interface Initiative {
  id: string
  title: string
  summary: string
  outcome: string | null
  startDate: Date | null
  targetDate: Date | null
  status: InitiativeStatus
  rag: RAGStatus
  confidence: number | null
  createdAt: Date
  updatedAt: Date
  organizationId: string
  teamId: string | null
  team: Team | null
  objectives: Objective[]
  owners: InitiativeOwner[]
}
```

### Objective

```typescript
interface Objective {
  id: string
  title: string
  keyResult: string | null
  sortIndex: number
  initiativeId: string
  createdAt: Date
  updatedAt: Date
}
```

### InitiativeOwner

```typescript
interface InitiativeOwner {
  id: string
  initiativeId: string
  personId: string
  role: string
  person: Person
  createdAt: Date
}
```

## Access Control

Initiatives follow these access rules:

1. All users in an organization can view initiatives
2. Initiatives are filtered by `organizationId` to ensure strict organization boundaries
3. Related entities (team, owners) must belong to the same organization
4. Deleting an initiative cascades to objectives, owners, and check-ins

## Use Cases

### 1. Creating an OKR-style Initiative

```typescript
await createInitiative({
  title: 'Improve Customer Satisfaction',
  summary: 'Enhance product experience and support',
  outcome: 'NPS score > 50',
  status: 'in_progress',
  rag: 'green',
  confidence: 7,
  objectives: [
    {
      title: 'Reduce support ticket resolution time',
      keyResult: 'Average resolution time < 24 hours',
    },
    {
      title: 'Improve onboarding experience',
      keyResult: '90% of users complete onboarding',
    },
    {
      title: 'Increase product adoption',
      keyResult: '50% increase in daily active users',
    },
  ],
  owners: [
    { personId: 'product_manager_id', role: 'owner' },
    { personId: 'engineering_lead_id', role: 'tech lead' },
  ],
})
```

### 2. Creating a Project Initiative

```typescript
await createInitiative({
  title: 'Database Migration to PostgreSQL',
  summary: 'Migrate from MySQL to PostgreSQL',
  outcome: 'Complete migration with zero downtime',
  startDate: '2025-11-01',
  targetDate: '2025-12-15',
  status: 'planning',
  rag: 'amber',
  confidence: 6,
  teamId: 'infrastructure_team_id',
  objectives: [
    { title: 'Set up PostgreSQL cluster' },
    { title: 'Migrate schema' },
    { title: 'Migrate data' },
    { title: 'Update application code' },
    { title: 'Deploy and cutover' },
  ],
})
```

## Related APIs

- [Tasks API](./tasks.md) - For creating tasks linked to initiatives and objectives
- [Teams API](./teams.md) - For team management
- [People API](./people.md) - For managing initiative owners
- [Meetings API](./meetings.md) - For initiative-related meetings

## Best Practices

1. **Clear Objectives**: Define specific, measurable objectives with key results
2. **RAG Status**: Update RAG status regularly to reflect initiative health
3. **Confidence Tracking**: Use confidence levels to communicate certainty
4. **Team Alignment**: Link initiatives to teams for better organization
5. **Multiple Owners**: Assign appropriate owners with clear roles
6. **Regular Updates**: Update status and objectives as the initiative progresses
