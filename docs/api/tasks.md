# Tasks API

## Overview

The Tasks API provides functionality for creating, reading, updating, and deleting tasks within an organization. Tasks can be assigned to people, linked to initiatives and objectives, and have various properties like status, priority, and due dates.

## Security

- All task operations require authentication
- Users can only access tasks they created or tasks associated with initiatives in their organization
- Tasks are scoped to the user's organization
- See the [Security Requirements](../../.cursor/rules/security-requirements.mdc) for detailed access control rules

## REST Endpoints

### GET /api/tasks

Retrieves tasks for the current user based on filter criteria.

**Authentication:** Required

**Query Parameters:**

| Parameter      | Type     | Required | Description                                                 |
| -------------- | -------- | -------- | ----------------------------------------------------------- |
| `status`       | string[] | No       | Filter by task status (e.g., `todo`, `in_progress`, `done`) |
| `priority`     | number[] | No       | Filter by priority (1-5)                                    |
| `assigneeId`   | string[] | No       | Filter by assignee person IDs                               |
| `initiativeId` | string[] | No       | Filter by initiative IDs                                    |
| `search`       | string   | No       | Search in task titles and descriptions                      |
| `view`         | string   | No       | View type: `all`, `my-tasks`, `created-by-me`               |
| `sortBy`       | string   | No       | Sort field (e.g., `dueDate`, `priority`, `createdAt`)       |
| `sortOrder`    | string   | No       | Sort direction: `asc` or `desc`                             |

**Response:**

```json
{
  "tasks": [
    {
      "id": "task_123",
      "title": "Complete user authentication",
      "description": "Implement OAuth flow",
      "status": "in_progress",
      "priority": 4,
      "dueDate": "2025-10-20T00:00:00.000Z",
      "completedAt": null,
      "createdAt": "2025-10-14T12:00:00.000Z",
      "updatedAt": "2025-10-14T12:00:00.000Z",
      "assignee": {
        "id": "person_456",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "https://..."
      },
      "createdBy": {
        "id": "user_789",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "initiative": {
        "id": "init_101",
        "title": "Q4 Platform Improvements"
      },
      "objective": {
        "id": "obj_102",
        "title": "Improve security"
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

Server actions are used for creating, updating, and deleting tasks from Server Components or Server Actions.

### createTask

Creates a new task.

**Function Signature:**

```typescript
createTask(formData: TaskFormData): Promise<void>
```

**Parameters:**

```typescript
interface TaskFormData {
  title: string // Max 200 characters
  description?: string // Optional description
  status: TaskStatus // 'todo' | 'in_progress' | 'in_review' | 'done'
  priority: number // 1-5 (1=lowest, 5=highest)
  assigneeId?: string // Person ID
  initiativeId?: string // Initiative ID
  objectiveId?: string // Objective ID
  dueDate?: string // ISO 8601 date string
}
```

**Returns:** Redirects to the created task page

**Throws:**

- `Error: "User must belong to an organization to create tasks"`
- `Error: "Assignee not found or access denied"`
- `Error: "Initiative not found or access denied"`
- `Error: "Objective not found or access denied"`

**Example:**

```typescript
import { createTask } from '@/lib/actions/task'

await createTask({
  title: 'Implement feature X',
  description: 'Add new feature to the platform',
  status: 'todo',
  priority: 3,
  assigneeId: 'person_123',
  dueDate: '2025-10-20',
})
```

---

### updateTask

Updates an existing task.

**Function Signature:**

```typescript
updateTask(taskId: string, formData: TaskFormData): Promise<void>
```

**Parameters:**

- `taskId`: The ID of the task to update
- `formData`: Same as `createTask`

**Returns:** Redirects to the updated task page

**Throws:**

- `Error: "User must belong to an organization to update tasks"`
- `Error: "Task not found or access denied"`
- `Error: "Assignee not found or access denied"`
- `Error: "Initiative not found or access denied"`
- `Error: "Objective not found or access denied"`

---

### deleteTask

Deletes a task.

**Function Signature:**

```typescript
deleteTask(taskId: string): Promise<void>
```

**Parameters:**

- `taskId`: The ID of the task to delete

**Returns:** `void`

**Throws:**

- `Error: "User must belong to an organization to delete tasks"`
- `Error: "Task not found or access denied"`

---

### getTask

Retrieves a single task by ID.

**Function Signature:**

```typescript
getTask(taskId: string): Promise<Task | null>
```

**Parameters:**

- `taskId`: The ID of the task to retrieve

**Returns:** Task object or `null` if not found

```typescript
interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: number
  dueDate: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  assignee: Person | null
  initiative: Initiative | null
  objective: Objective | null
  createdBy: User
}
```

**Throws:**

- `Error: "User must belong to an organization to view tasks"`

---

### createQuickTask

Creates a quick task with minimal information.

**Function Signature:**

```typescript
createQuickTask(title: string, dueDate?: string): Promise<Task>
```

**Parameters:**

- `title`: Task title (max 200 characters)
- `dueDate`: Optional due date (ISO 8601 string)

**Returns:** Created task object

**Throws:**

- `Error: "User must belong to an organization to create tasks"`
- `Error: "Task title is required"`
- `Error: "Title must be less than 200 characters"`

**Example:**

```typescript
const task = await createQuickTask('Review PR #123', '2025-10-15')
```

---

### createQuickTaskForInitiative

Creates a quick task linked to an initiative.

**Function Signature:**

```typescript
createQuickTaskForInitiative(
  title: string,
  initiativeId: string,
  objectiveId?: string,
  dueDate?: string
): Promise<Task>
```

**Parameters:**

- `title`: Task title (max 200 characters)
- `initiativeId`: Initiative ID to link to
- `objectiveId`: Optional objective ID
- `dueDate`: Optional due date

**Returns:** Created task object

**Throws:**

- `Error: "User must belong to an organization to create tasks"`
- `Error: "Task title is required"`
- `Error: "Title must be less than 200 characters"`
- `Error: "Initiative not found or access denied"`
- `Error: "Objective not found or does not belong to this initiative"`

---

### updateTaskStatus

Updates only the status of a task.

**Function Signature:**

```typescript
updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task>
```

**Parameters:**

- `taskId`: The ID of the task
- `status`: New task status

**Returns:** Updated task object

**Throws:**

- `Error: "User must belong to an organization to update tasks"`
- `Error: "Task not found or access denied"`

**Example:**

```typescript
await updateTaskStatus('task_123', 'done')
```

---

### updateTaskTitle

Updates only the title of a task.

**Function Signature:**

```typescript
updateTaskTitle(taskId: string, title: string): Promise<Task>
```

**Parameters:**

- `taskId`: The ID of the task
- `title`: New title (max 200 characters)

**Returns:** Updated task object

**Throws:**

- `Error: "User must belong to an organization to update tasks"`
- `Error: "Task not found or access denied"`
- `Error: "Task title is required"`
- `Error: "Title must be less than 200 characters"`

---

### updateTaskAssignee

Updates only the assignee of a task.

**Function Signature:**

```typescript
updateTaskAssignee(taskId: string, assigneeId: string | null): Promise<Task>
```

**Parameters:**

- `taskId`: The ID of the task
- `assigneeId`: Person ID to assign to, or `null` to unassign

**Returns:** Updated task object

**Throws:**

- `Error: "User must belong to an organization to update tasks"`
- `Error: "Task not found or access denied"`
- `Error: "Assignee not found or access denied"`

---

### updateTaskPriority

Updates only the priority of a task.

**Function Signature:**

```typescript
updateTaskPriority(taskId: string, priority: number): Promise<Task>
```

**Parameters:**

- `taskId`: The ID of the task
- `priority`: Priority level (1-5)

**Returns:** Updated task object

**Throws:**

- `Error: "User must belong to an organization to update tasks"`
- `Error: "Task not found or access denied"`
- `Error: "Priority must be between 1 and 5"`

---

### updateTaskQuickEdit

Updates multiple task fields at once.

**Function Signature:**

```typescript
updateTaskQuickEdit(
  taskId: string,
  updates: {
    title?: string
    description?: string
    assigneeId?: string | null
    dueDate?: string | null
    priority?: number
  }
): Promise<Task>
```

**Parameters:**

- `taskId`: The ID of the task
- `updates`: Object with fields to update

**Returns:** Updated task object

**Throws:**

- `Error: "User must belong to an organization to update tasks"`
- `Error: "Task not found or access denied"`
- `Error: "Assignee not found or access denied"`

**Example:**

```typescript
await updateTaskQuickEdit('task_123', {
  title: 'Updated title',
  priority: 5,
  dueDate: '2025-10-25',
})
```

## Task Status Values

- `todo` - Task is not started
- `in_progress` - Task is being worked on
- `in_review` - Task is under review
- `done` - Task is completed

## Task Priority Values

Priority is represented as a number from 1 to 5:

- `1` - Very Low
- `2` - Low
- `3` - Medium (default)
- `4` - High
- `5` - Critical

## Access Control

Tasks follow these access rules:

1. Users can see tasks they created within their organization
2. Users can see tasks associated with initiatives in their organization
3. Users can see tasks associated with objectives of initiatives in their organization
4. Tasks are filtered by `organizationId` to ensure strict organization boundaries

## Related APIs

- [People API](./people.md) - For managing task assignees
- [Initiatives API](./initiatives.md) - For managing task initiatives
- [Organizations API](./organizations.md) - For organization management
