# ManagerOS API Documentation

## Overview

This documentation covers all APIs available in ManagerOS, a comprehensive platform for managing organizations, teams, people, initiatives, tasks, and feedback.

## API Architecture

ManagerOS uses a hybrid API architecture:

1. **REST Endpoints** (`/api/*`) - For client-side data fetching with query parameters and filters
2. **Server Actions** (`'use server'`) - For mutations and server-side operations from Server Components
3. **Real-time** - Server-Sent Events for live notifications

## Authentication

ManagerOS supports two authentication methods:

1. **Clerk Session Authentication** (default) - For web UI and server-side requests
2. **OAuth Bearer Token Authentication** - For third-party applications and API clients

### Clerk Session Authentication

All APIs require authentication via Clerk. User sessions include:

- User ID
- Organization ID
- User role (ADMIN or USER)
- Linked person ID (if applicable)

### OAuth Bearer Token Authentication

ManagerOS uses Clerk's built-in OAuth 2.0 provider to enable third-party applications to access the API using bearer tokens.

For detailed OAuth documentation, see [OAuth Authentication](../oauth-authentication.md).

#### Setting Up OAuth

1. **Create OAuth Application in Clerk Dashboard:**
   - Navigate to Clerk Dashboard > OAuth Applications
   - Click "Add OAuth application"
   - Enter name and select scopes (see [OAuth Scopes](#oauth-scopes) below)
   - Copy Client ID and Client Secret (shown once - store securely)
   - Add redirect URIs for your application

2. **Configure Your Client Application:**
   - **Discovery URL**: `{CLERK_FRONTEND_API_URL}/.well-known/openid-configuration`
   - **Authorization URL**: `{CLERK_FRONTEND_API_URL}/oauth/authorize`
   - **Token URL**: `{CLERK_FRONTEND_API_URL}/oauth/token`
   - **UserInfo URL**: `{CLERK_FRONTEND_API_URL}/oauth/userinfo`

   Your `CLERK_FRONTEND_API_URL` can be found in Clerk Dashboard > API Keys.

#### OAuth Flow

1. **Authorization**: Redirect user to Clerk's authorization endpoint

   ```
   GET {CLERK_FRONTEND_API_URL}/oauth/authorize?
     client_id=YOUR_CLIENT_ID&
     response_type=code&
     redirect_uri=YOUR_REDIRECT_URI&
     scope=read:people%20read:tasks&
     state=RANDOM_STATE_STRING
   ```

2. **Token Exchange**: Exchange authorization code for access token

   ```bash
   POST {CLERK_FRONTEND_API_URL}/oauth/token
   Content-Type: application/x-www-form-urlencoded
   Authorization: Basic BASE64(CLIENT_ID:CLIENT_SECRET)

   grant_type=authorization_code&
   code=AUTHORIZATION_CODE&
   redirect_uri=YOUR_REDIRECT_URI
   ```

3. **API Access**: Use access token in API requests
   ```bash
   GET /api/user/current
   Authorization: Bearer YOUR_ACCESS_TOKEN
   ```

#### OAuth Scopes

OAuth scopes define what permissions your application has. Available scopes:

| Scope               | Description                                  | Permissions                                                 |
| ------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| `read:people`       | Read people data                             | `person.view`                                               |
| `write:people`      | Create, update, and delete people            | `person.create`, `person.edit`, `person.delete`             |
| `read:tasks`        | Read tasks                                   | `task.view`                                                 |
| `write:tasks`       | Create, update, and delete tasks             | `task.create`, `task.edit`, `task.delete`                   |
| `read:initiatives`  | Read initiatives                             | `initiative.view`                                           |
| `write:initiatives` | Create, update, and delete initiatives       | `initiative.create`, `initiative.edit`, `initiative.delete` |
| `admin`             | Full admin access (organization admins only) | All permissions                                             |

**Note**: The `admin` scope is only granted to users who are organization administrators. Requesting this scope for a non-admin user will result in the scope being omitted from the token.

#### Using Bearer Tokens

Once you have an access token, include it in the `Authorization` header:

```typescript
const response = await fetch('/api/user/current', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
})
```

All ManagerOS API endpoints support bearer token authentication. The system automatically detects bearer tokens and validates them using Clerk's token introspection endpoint.

#### Token Validation

ManagerOS validates OAuth tokens by:

1. Calling Clerk's `/oauth/token_info` endpoint to verify token validity
2. Extracting user information from the token
3. Mapping the Clerk user to ManagerOS user record
4. Enforcing scope-based permissions

#### Example: Complete OAuth Flow

```typescript
// 1. Redirect user to authorization (client-side)
const authUrl = new URL(`${CLERK_FRONTEND_API_URL}/oauth/authorize`)
authUrl.searchParams.set('client_id', CLIENT_ID)
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
authUrl.searchParams.set('scope', 'read:people read:tasks')
authUrl.searchParams.set('state', generateState())
window.location.href = authUrl.toString()

// 2. Exchange code for token (server-side)
const tokenResponse = await fetch(`${CLERK_FRONTEND_API_URL}/oauth/token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: REDIRECT_URI,
  }),
})
const { access_token, refresh_token } = await tokenResponse.json()

// 3. Use token for API calls
const apiResponse = await fetch('/api/tasks', {
  headers: {
    Authorization: `Bearer ${access_token}`,
  },
})
const { tasks } = await apiResponse.json()
```

#### Token Refresh

Access tokens expire after a set period. Use the refresh token to obtain a new access token:

```bash
POST {CLERK_FRONTEND_API_URL}/oauth/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic BASE64(CLIENT_ID:CLIENT_SECRET)

grant_type=refresh_token&
refresh_token=YOUR_REFRESH_TOKEN
```

For more details, see [Clerk's OAuth Documentation](https://clerk.com/docs/guides/configure/auth-strategies/oauth/single-sign-on#option-2-sign-in-with-your-app).

### Security Model

- **Organization Isolation**: All data is scoped to the user's organization
- **Role-Based Access**: Admin users have additional permissions
- **Person Linking**: Some features require users to be linked to a person record
- **Access Control**: Strict rules enforce who can access what data

See [Security Requirements](../../.cursor/rules/security-requirements.mdc) for detailed access control rules.

## API Reference

### Core Entities

| API                 | Description                                   | Documentation                                |
| ------------------- | --------------------------------------------- | -------------------------------------------- |
| **Tasks**           | Create, manage, and track tasks               | [View Docs](./tasks.md)                      |
| **People**          | Manage people in the organization             | [View Docs](./people.md)                     |
| **Teams**           | Organize people into hierarchical teams       | [View Docs](./teams.md)                      |
| **Initiatives**     | Track strategic initiatives and objectives    | [View Docs](./initiatives.md)                |
| **One-on-Ones**     | Manage one-on-one meetings                    | [View Docs](./oneonones.md)                  |
| **Feedback**        | Give and receive feedback                     | [View Docs](./feedback.md)                   |
| **Tolerance Rules** | Monitor organizational metrics and exceptions | [View Docs](./tolerance-rules-exceptions.md) |

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

| Status Code                 | Meaning            | Common Causes                                    |
| --------------------------- | ------------------ | ------------------------------------------------ |
| `400 Bad Request`           | Invalid input      | Validation errors, malformed data                |
| `401 Unauthorized`          | Not authenticated  | No session, expired session, invalid OAuth token |
| `403 Forbidden`             | Access denied      | No organization, insufficient permissions        |
| `404 Not Found`             | Resource not found | Invalid ID, deleted resource                     |
| `500 Internal Server Error` | Server error       | Unexpected server issues                         |

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
