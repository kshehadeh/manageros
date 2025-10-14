# ManagerOS API Documentation

## Overview

This documentation covers all APIs available in ManagerOS, a comprehensive platform for managing organizations, teams, people, initiatives, tasks, and feedback.

## API Architecture

ManagerOS uses a hybrid API architecture:

1. **REST Endpoints** (`/api/*`) - For client-side data fetching with query parameters and filters
2. **Server Actions** (`'use server'`) - For mutations and server-side operations from Server Components
3. **Real-time** - Server-Sent Events for live notifications

## Authentication

All APIs require authentication via NextAuth.js. User sessions include:

- User ID
- Organization ID
- User role (ADMIN or USER)
- Linked person ID (if applicable)

### Security Model

- **Organization Isolation**: All data is scoped to the user's organization
- **Role-Based Access**: Admin users have additional permissions
- **Person Linking**: Some features require users to be linked to a person record
- **Access Control**: Strict rules enforce who can access what data

See [Security Requirements](../../.cursor/rules/security-requirements.mdc) for detailed access control rules.

## API Reference

### Core Entities

| API             | Description                                | Documentation                 |
| --------------- | ------------------------------------------ | ----------------------------- |
| **Tasks**       | Create, manage, and track tasks            | [View Docs](./tasks.md)       |
| **People**      | Manage people in the organization          | [View Docs](./people.md)      |
| **Teams**       | Organize people into hierarchical teams    | [View Docs](./teams.md)       |
| **Initiatives** | Track strategic initiatives and objectives | [View Docs](./initiatives.md) |
| **Meetings**    | Schedule and manage meetings               | [View Docs](./meetings.md)    |
| **One-on-Ones** | Manage one-on-one meetings                 | [View Docs](./oneonones.md)   |
| **Feedback**    | Give and receive feedback                  | [View Docs](./feedback.md)    |

### Platform Services

| API               | Description                                            | Documentation                   |
| ----------------- | ------------------------------------------------------ | ------------------------------- |
| **Organizations** | Organization setup, invitations, and member management | [View Docs](./organizations.md) |
| **Notifications** | Create and manage notifications                        | [View Docs](./notifications.md) |

## Quick Start

### Making API Calls

#### REST Endpoints (Client-Side)

```typescript
// Example: Fetch tasks
const response = await fetch(
  '/api/tasks?status=in_progress&assigneeId=person_123'
)
const { tasks } = await response.json()
```

#### Server Actions (Server-Side)

```typescript
import { createTask } from '@/lib/actions/task'

// Example: Create a task
await createTask({
  title: 'Implement feature X',
  status: 'todo',
  priority: 3,
  assigneeId: 'person_123',
})
```

### Common Patterns

#### 1. List with Filters

```typescript
// REST API
const response = await fetch(
  '/api/tasks?status=in_progress&priority=4,5&assigneeId=person_123'
)
const { tasks } = await response.json()
```

#### 2. Create Entity

```typescript
// Server Action
import { createTask } from '@/lib/actions/task'

const task = await createTask({
  title: 'New task',
  status: 'todo',
  priority: 3,
})
```

#### 3. Update Entity

```typescript
// Server Action
import { updateTask } from '@/lib/actions/task'

await updateTask('task_123', {
  status: 'done',
  completedAt: new Date().toISOString(),
})
```

#### 4. Delete Entity

```typescript
// Server Action
import { deleteTask } from '@/lib/actions/task'

await deleteTask('task_123')
```

## Response Formats

### Success Response

REST endpoints return JSON with the requested data:

```json
{
  "tasks": [
    {
      "id": "task_123",
      "title": "Task title",
      "status": "in_progress",
      ...
    }
  ]
}
```

### Paginated Response

Some endpoints return paginated data:

```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Error Response

Errors are returned with appropriate HTTP status codes:

```json
{
  "error": "Task not found or access denied"
}
```

## Error Handling

### Common Error Codes

| Status Code                 | Meaning            | Common Causes                             |
| --------------------------- | ------------------ | ----------------------------------------- |
| `400 Bad Request`           | Invalid input      | Validation errors, malformed data         |
| `401 Unauthorized`          | Not authenticated  | No session, expired session               |
| `403 Forbidden`             | Access denied      | No organization, insufficient permissions |
| `404 Not Found`             | Resource not found | Invalid ID, deleted resource              |
| `500 Internal Server Error` | Server error       | Unexpected server issues                  |

### Server Action Errors

Server actions throw errors that should be caught and handled:

```typescript
try {
  await createTask(formData)
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to create task:', error.message)
    // Handle specific errors
    if (error.message.includes('organization')) {
      // Handle organization error
    }
  }
}
```

## Access Control

### Organization Scoping

All data is scoped to the user's organization. Users cannot access data from other organizations.

### Role-Based Permissions

| Role      | Permissions                                                                   |
| --------- | ----------------------------------------------------------------------------- |
| **ADMIN** | Full access to all organization data, can manage members, roles, and settings |
| **USER**  | Can view most data, limited management capabilities                           |

### Entity-Specific Rules

Each entity has specific access rules:

- **Tasks**: Users can see tasks they created or tasks linked to initiatives in their org
- **People**: Admins can create/update/delete; all users can view
- **Feedback**: Private feedback only visible to author; public feedback visible to all in org
- **One-on-Ones**: Only visible to the two participants
- **Meetings**: Public meetings visible to all; private meetings only to creator and participants

See individual API documentation for detailed access rules.

## Common Use Cases

### 1. Task Management

```typescript
// Create a task
const task = await createTask({
  title: 'Implement user authentication',
  description: 'Add OAuth support',
  status: 'todo',
  priority: 4,
  assigneeId: 'person_123',
  initiativeId: 'init_456',
  dueDate: '2025-10-20',
})

// Update task status
await updateTaskStatus('task_123', 'in_progress')

// Get tasks with filters
const response = await fetch(
  '/api/tasks?assigneeId=person_123&status=in_progress'
)
const { tasks } = await response.json()
```

### 2. People and Teams

```typescript
// Create a team
await createTeam({
  name: 'Engineering',
  description: 'Product engineering team',
  parentId: null, // Top-level team
})

// Create a person
await createPerson({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Software Engineer',
  status: 'active',
  teamId: 'team_123',
  managerId: 'person_456',
})

// Get team hierarchy
const hierarchy = await getCompleteTeamHierarchy()
```

### 3. Initiatives and Objectives

```typescript
// Create an initiative with objectives
await createInitiative({
  title: 'Q4 Platform Improvements',
  summary: 'Improve performance and reliability',
  status: 'in_progress',
  rag: 'green',
  confidence: 8,
  objectives: [
    {
      title: 'Reduce API latency',
      keyResult: 'P95 < 100ms',
    },
    {
      title: 'Improve database performance',
      keyResult: 'Query time < 50ms',
    },
  ],
  owners: [{ personId: 'person_123', role: 'owner' }],
})
```

### 4. Feedback and One-on-Ones

```typescript
// Give feedback
await createFeedback({
  aboutId: 'person_123',
  kind: 'positive',
  isPrivate: false,
  body: 'Excellent work on the Q3 project!',
})

// Schedule one-on-one
await createOneOnOne({
  participant1Id: 'manager_id',
  participant2Id: 'report_id',
  scheduledAt: '2025-10-20T14:00:00.000Z',
  notes: 'Quarterly review',
})
```

### 5. Organization Management

```typescript
// Invite user to organization
const invitation = await createOrganizationInvitation('newuser@example.com')

// Link user to person
await linkUserToPerson('user_123', 'person_456')

// Promote to admin
await updateUserRole('user_123', 'ADMIN')
```

## Rate Limiting

Currently, there are no enforced rate limits, but it's recommended to:

- Batch operations when possible
- Use pagination for large datasets
- Cache responses on the client side
- Avoid unnecessary refetching

## Versioning

The ManagerOS API is currently unversioned. Breaking changes will be communicated via:

- Release notes
- Migration guides
- Deprecation notices in the codebase

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
try {
  await createTask(formData)
} catch (error) {
  if (error instanceof Error) {
    // Show user-friendly error message
    toast.error(error.message)
  }
}
```

### 2. Optimistic Updates

For better UX, use optimistic updates:

```typescript
// Update UI immediately
setTasks(tasks.map(t => (t.id === taskId ? { ...t, status: 'done' } : t)))

// Then update server
try {
  await updateTaskStatus(taskId, 'done')
} catch (error) {
  // Revert on error
  setTasks(originalTasks)
}
```

### 3. Caching

Implement client-side caching for frequently accessed data:

```typescript
const { data: people } = usePeopleCache() // Custom hook with caching
```

### 4. Pagination

Use pagination for large datasets:

```typescript
const { tasks, pagination } = await fetch('/api/tasks?page=1&limit=20')
```

### 5. Access Control

Always check permissions before showing UI elements:

```typescript
const user = await getCurrentUser()

{user.role === 'ADMIN' && (
  <Button onClick={() => deleteTeam(teamId)}>Delete</Button>
)}
```

## TypeScript Support

All APIs are fully typed. Import types from the appropriate modules:

```typescript
import type { Task, TaskFormData, TaskStatus } from '@/lib/validations'
import type { Person, Team, Initiative } from '@prisma/client'
```

## Development

### Running Locally

```bash
# Install dependencies
bun install

# Set up database
bunx prisma generate
bunx prisma db push

# Run development server
bun dev
```

### Testing APIs

```bash
# Run tests
bun test

# Type checking
bunx tsc --noEmit
```

## Support

- **Documentation**: See individual API docs linked above
- **Issues**: Check GitHub issues for known problems
- **Security**: Review [Security Requirements](../../.cursor/rules/security-requirements.mdc)

## Changelog

See [roadmap.md](../../roadmap.md) for recent changes and upcoming features.

---

**Last Updated**: October 2025  
**API Version**: 1.0  
**Framework**: Next.js 15 with App Router
