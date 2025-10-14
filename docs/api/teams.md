# Teams API

## Overview

The Teams API provides functionality for managing organizational teams. Teams can have hierarchical parent-child relationships, contain people, and be associated with initiatives.

## Security

- All team operations require authentication
- Teams are scoped to the user's organization
- All users can view teams in their organization
- Creating, updating, and deleting teams requires appropriate permissions
- See the [Security Requirements](../../.cursor/rules/security-requirements.mdc) for detailed access control rules

## REST Endpoints

### GET /api/teams

Retrieves all teams in the current user's organization.

**Authentication:** Required

**Query Parameters:**

| Parameter          | Type    | Required | Description                         |
| ------------------ | ------- | -------- | ----------------------------------- |
| `includeHierarchy` | boolean | No       | Include full hierarchical structure |
| `parentId`         | string  | No       | Filter by parent team ID            |

**Response:**

```json
{
  "teams": [
    {
      "id": "team_123",
      "name": "Engineering",
      "description": "Product engineering team",
      "avatar": "https://...",
      "parentId": null,
      "createdAt": "2025-10-01T12:00:00.000Z",
      "updatedAt": "2025-10-14T12:00:00.000Z",
      "parent": null,
      "_count": {
        "people": 15,
        "initiatives": 3,
        "children": 2
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

## Server Actions

### createTeam

Creates a new team.

**Function Signature:**

```typescript
createTeam(formData: TeamFormData): Promise<void>
```

**Parameters:**

```typescript
interface TeamFormData {
  name: string // Required, team name
  description?: string // Optional description
  avatar?: string // Optional avatar URL
  parentId?: string // Optional parent team ID
}
```

**Returns:** Redirects to teams list page

**Throws:**

- `Error: "User is not associated with an organization"`
- `Error: "Organization not found"`
- `Error: "Parent team not found or access denied"`

**Example:**

```typescript
import { createTeam } from '@/lib/actions/team'

await createTeam({
  name: 'Frontend Team',
  description: 'React and Next.js development',
  parentId: 'engineering_team_id',
})
```

---

### updateTeam

Updates an existing team.

**Function Signature:**

```typescript
updateTeam(id: string, formData: TeamFormData): Promise<void>
```

**Parameters:**

- `id`: Team ID to update
- `formData`: Same as `createTeam`

**Returns:** Redirects to teams list page

**Throws:**

- `Error: "User must belong to an organization to update teams"`
- `Error: "Team not found or access denied"`
- `Error: "Team cannot be its own parent"`
- `Error: "Parent team not found or access denied"`

**Example:**

```typescript
await updateTeam('team_123', {
  name: 'Frontend Engineering',
  description: 'React, Next.js, and design system development',
  parentId: 'engineering_team_id',
})
```

---

### deleteTeam

Deletes a team.

**Function Signature:**

```typescript
deleteTeam(id: string): Promise<void>
```

**Parameters:**

- `id`: Team ID to delete

**Returns:** `void`

**Throws:**

- `Error: "User must belong to an organization to delete teams"`
- `Error: "Team not found or access denied"`
- `Error: "Cannot delete team '{name}' because it has {count} member(s). Please reassign or remove team members first."`
- `Error: "Cannot delete team '{name}' because it has {count} initiative(s). Please reassign or delete initiatives first."`
- `Error: "Cannot delete team '{name}' because it has {count} child team(s). Please delete or reassign child teams first."`

**Constraints:**

Cannot delete a team if it has:

- Active members
- Associated initiatives
- Child teams

**Example:**

```typescript
// Will fail if team has members
try {
  await deleteTeam('team_123')
} catch (error) {
  // Handle error: reassign members first
}
```

---

### getTeams

Retrieves all teams in the current user's organization (flat list).

**Function Signature:**

```typescript
getTeams(): Promise<Team[]>
```

**Returns:** Array of team objects

```typescript
interface Team {
  id: string
  name: string
  description: string | null
  avatar: string | null
  parentId: string | null
  organizationId: string
  createdAt: Date
  updatedAt: Date
}
```

---

### getAllTeamsWithRelations

Retrieves all teams with parent info and relation counts.

**Function Signature:**

```typescript
getAllTeamsWithRelations(): Promise<TeamWithCounts[]>
```

**Returns:** Array of teams with counts

```typescript
interface TeamWithCounts extends Team {
  parent: {
    id: string
    name: string
  } | null
  _count: {
    people: number
    initiatives: number
    children: number
  }
}
```

**Example:**

```typescript
const teams = await getAllTeamsWithRelations()
teams.forEach(team => {
  console.log(
    `${team.name}: ${team._count.people} people, ${team._count.children} sub-teams`
  )
})
```

---

### getCompleteTeamHierarchy

Retrieves the complete team hierarchy starting from top-level teams.

**Function Signature:**

```typescript
getCompleteTeamHierarchy(): Promise<TeamWithHierarchy[]>
```

**Returns:** Array of top-level teams with nested children

```typescript
interface TeamWithHierarchy extends Team {
  people: Person[]
  initiatives: Initiative[]
  parent: Team | null
  children: TeamWithHierarchy[] // Recursive
}
```

**Example:**

```typescript
const hierarchy = await getCompleteTeamHierarchy()
// Returns top-level teams with full nested structure
// hierarchy[0].children[0].children[0]...
```

---

### getTeamHierarchyOptimized

An optimized version that fetches all teams in one query and builds hierarchy in memory.

**Function Signature:**

```typescript
getTeamHierarchyOptimized(): Promise<TeamWithHierarchy[]>
```

**Returns:** Array of top-level teams with nested children

**Note:** More efficient for large hierarchies with many teams. Uses a single database query followed by in-memory hierarchy construction.

---

### getTeam

Retrieves a single team with all relations.

**Function Signature:**

```typescript
getTeam(id: string): Promise<TeamWithRelations | null>
```

**Parameters:**

- `id`: Team ID

**Returns:** Team object with relations or `null`

```typescript
interface TeamWithRelations extends Team {
  people: Person[]
  initiatives: Initiative[]
  parent: Team | null
  children: Team[]
}
```

**Example:**

```typescript
const team = await getTeam('team_123')
if (team) {
  console.log(`${team.name} has ${team.people.length} members`)
  console.log(`Parent: ${team.parent?.name || 'None'}`)
  console.log(`Child teams: ${team.children.map(c => c.name).join(', ')}`)
}
```

---

### getTeamsForSelection

Retrieves simplified team list for dropdowns and selections.

**Function Signature:**

```typescript
getTeamsForSelection(excludeId?: string): Promise<TeamForSelection[]>
```

**Parameters:**

- `excludeId`: Optional team ID to exclude from results

**Returns:** Array of simplified team objects

```typescript
interface TeamForSelection {
  id: string
  name: string
  parentId: string | null
}
```

**Example:**

```typescript
// Get all teams except the current one (for parent selection)
const availableParents = await getTeamsForSelection('current_team_id')
```

## Team Hierarchy

Teams support hierarchical parent-child relationships:

### Creating a Team Hierarchy

```typescript
// 1. Create parent team
await createTeam({
  name: 'Engineering',
  description: 'All engineering teams',
})

// 2. Create child teams
await createTeam({
  name: 'Frontend',
  description: 'Frontend development',
  parentId: 'engineering_id',
})

await createTeam({
  name: 'Backend',
  description: 'Backend development',
  parentId: 'engineering_id',
})

// 3. Create sub-teams
await createTeam({
  name: 'Design System',
  description: 'Component library and design tokens',
  parentId: 'frontend_id',
})
```

### Hierarchy Structure Example

```
Organization
├── Engineering
│   ├── Frontend
│   │   ├── Design System
│   │   └── Web Apps
│   ├── Backend
│   │   ├── API
│   │   └── Infrastructure
│   └── Mobile
│       ├── iOS
│       └── Android
├── Product
│   ├── Product Management
│   └── Design
└── Operations
    ├── Customer Success
    └── Support
```

## Data Model

### Team Schema

```typescript
interface Team {
  id: string
  name: string
  description: string | null
  avatar: string | null
  parentId: string | null
  organizationId: string
  createdAt: Date
  updatedAt: Date

  // Relations
  parent: Team | null
  children: Team[]
  people: Person[]
  initiatives: Initiative[]
}
```

## Access Control

Teams follow these access rules:

1. All users can view teams in their organization
2. Teams are filtered by `organizationId`
3. Parent teams must be in the same organization
4. Cannot create circular references (team as its own parent)
5. Cannot delete teams with members, initiatives, or child teams

## Constraints

### Deletion Constraints

Before deleting a team, you must:

1. **Remove or reassign all team members** to other teams
2. **Remove or reassign all initiatives** associated with the team
3. **Delete or reassign all child teams** to a different parent

### Parent Constraints

When setting a parent team:

1. Parent must exist in the same organization
2. Cannot set a team as its own parent
3. Parent must not create a circular reference

## Use Cases

### 1. Create Flat Team Structure

```typescript
// Simple list of teams without hierarchy
await createTeam({ name: 'Engineering' })
await createTeam({ name: 'Product' })
await createTeam({ name: 'Design' })
await createTeam({ name: 'Operations' })
```

### 2. Create Hierarchical Team Structure

```typescript
// Create parent
await createTeam({
  name: 'Engineering',
  description: 'All technical teams',
})

// Create children
await createTeam({
  name: 'Platform',
  parentId: 'engineering_id',
  description: 'Infrastructure and core platform',
})

await createTeam({
  name: 'Product Engineering',
  parentId: 'engineering_id',
  description: 'Product development teams',
})
```

### 3. Reorganize Teams

```typescript
// Move a team to a new parent
await updateTeam('mobile_team_id', {
  name: 'Mobile',
  parentId: 'product_engineering_id', // Changed parent
})

// Remove parent (move to top level)
await updateTeam('mobile_team_id', {
  name: 'Mobile',
  parentId: null,
})
```

### 4. Query Team Hierarchy

```typescript
// Get full hierarchy
const hierarchy = await getCompleteTeamHierarchy()

// Render tree
function renderTeamTree(teams: TeamWithHierarchy[], indent = 0) {
  teams.forEach(team => {
    console.log(
      '  '.repeat(indent) + `- ${team.name} (${team.people.length} people)`
    )
    if (team.children.length > 0) {
      renderTeamTree(team.children, indent + 1)
    }
  })
}

renderTeamTree(hierarchy)
```

## Related APIs

- [People API](./people.md) - For managing team members
- [Initiatives API](./initiatives.md) - For team initiatives
- [Organizations API](./organizations.md) - For organization management

## Best Practices

### 1. Meaningful Hierarchy

Create hierarchies that reflect your organization structure:

```typescript
// Good: Reflects actual organization structure
Engineering > Frontend > Design System
Engineering > Backend > API

// Avoid: Overly deep or unclear hierarchies
Root > Division > Department > Group > Sub-Group > Team > Sub-Team
```

### 2. Consistent Naming

Use consistent naming conventions:

```typescript
// Good: Consistent naming
await createTeam({ name: 'Engineering - Frontend' })
await createTeam({ name: 'Engineering - Backend' })
await createTeam({ name: 'Engineering - Mobile' })

// Also good: Without prefix (if using hierarchy)
await createTeam({ name: 'Frontend', parentId: 'engineering_id' })
await createTeam({ name: 'Backend', parentId: 'engineering_id' })
```

### 3. Clean Up Before Deletion

Always check dependencies before deleting:

```typescript
const team = await getTeam('team_123')

if (team) {
  if (team.people.length > 0) {
    console.log('Reassign members first')
  }
  if (team.initiatives.length > 0) {
    console.log('Reassign initiatives first')
  }
  if (team.children.length > 0) {
    console.log('Handle child teams first')
  }

  // Only delete when clean
  if (
    team.people.length === 0 &&
    team.initiatives.length === 0 &&
    team.children.length === 0
  ) {
    await deleteTeam('team_123')
  }
}
```

### 4. Performance Considerations

For large team structures, use optimized methods:

```typescript
// For large hierarchies (100+ teams)
const hierarchy = await getTeamHierarchyOptimized()

// For simple lists or counts
const teams = await getAllTeamsWithRelations()

// For dropdowns
const teamOptions = await getTeamsForSelection()
```
