# TaskList Component Usage Guide

The `TaskList` component is a reusable component for displaying tasks in different contexts throughout the application. It provides a consistent interface for task management with different variants and configurations.

## Basic Usage

```tsx
import { TaskList, type Task } from '@/components/tasks/task-list'

const tasks: Task[] = [
  {
    id: '1',
    title: 'Complete project documentation',
    status: 'TODO',
    dueDate: new Date('2024-01-15'),
    priority: 1,
    initiative: { title: 'Q1 Goals' },
  },
]

function MyComponent() {
  return (
    <TaskList
      tasks={tasks}
      title='My Tasks'
      onTaskUpdate={() => window.location.reload()}
    />
  )
}
```

## Variants

### Compact Variant (Dashboard)

The compact variant is designed for dashboard sections where space is limited. It shows initiative titles inline with task information.

```tsx
<TaskList
  tasks={tasks}
  title='Assigned Tasks'
  variant='compact'
  viewAllHref='/my-tasks'
  viewAllLabel='My Tasks'
  emptyStateText='No active tasks assigned to you.'
  onTaskUpdate={handleTaskUpdate}
/>
```

### Full Variant (Detail Pages)

The full variant is designed for detail pages where more space is available. It doesn't show initiative titles inline to save space.

```tsx
<TaskList
  tasks={tasks}
  title='Tasks'
  variant='full'
  showAddButton={true}
  initiativeId='initiative-123'
  emptyStateText='No tasks found for this initiative.'
  onTaskUpdate={handleTaskUpdate}
/>
```

## Props

| Prop               | Type                      | Default             | Description                                                   |
| ------------------ | ------------------------- | ------------------- | ------------------------------------------------------------- |
| `tasks`            | `Task[]`                  | -                   | Array of tasks to display                                     |
| `title`            | `string`                  | `"Tasks"`           | Title for the section header                                  |
| `variant`          | `"compact" \| "full"`     | `"compact"`         | Display variant                                               |
| `showAddButton`    | `boolean`                 | `false`             | Show add task button                                          |
| `initiativeId`     | `string`                  | -                   | Initiative ID for adding new tasks                            |
| `viewAllHref`      | `string`                  | -                   | Link for "View All" button                                    |
| `viewAllLabel`     | `string`                  | `"View All"`        | Label for "View All" button                                   |
| `emptyStateText`   | `string`                  | `"No tasks found."` | Text shown when no tasks                                      |
| `onTaskUpdate`     | `() => void`              | -                   | Callback when tasks are updated                               |
| `className`        | `string`                  | `""`                | Additional CSS classes                                        |
| `immutableFilters` | `Record<string, unknown>` | -                   | Filters to apply to the task list (cannot be changed by user) |

## Task Interface

```tsx
interface Task {
  id: string
  title: string
  description?: string | null
  assigneeId?: string | null
  dueDate?: Date | null
  priority: number
  status: string
  initiative?: {
    title: string
  } | null
}
```

## Features

- **Task Completion**: Click checkbox to mark tasks as complete
- **Quick Edit**: Click on task title to open quick edit dialog
- **Context Menu**: Right-click or use menu button for additional actions
- **Add Tasks**: Optional add task functionality with modal
- **Immutable Filters**: Pre-configure what tasks to show without user control
- **Responsive Design**: Works on mobile and desktop
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Immutable Filters

The `immutableFilters` prop allows you to pre-filter tasks based on specific criteria. These filters are applied automatically and cannot be changed by the user.

### Supported Filter Types

- **`initiativeId`**: Filter by initiative ID
- **`assigneeId`**: Filter by assignee ID
- **`status`**: Filter by status (string or array of statuses)
- **`priority`**: Filter by priority level
- **`createdById`**: Filter by creator ID
- **`objectiveId`**: Filter by objective ID
- **Custom fields**: Any other task property can be filtered

### Examples

```tsx
// Filter by initiative
immutableFilters={{ initiativeId: 'init-123' }}

// Filter by assignee and status
immutableFilters={{
  assigneeId: 'user-456',
  status: ['todo', 'doing']
}}

// Filter by priority
immutableFilters={{ priority: 1 }}

// Multiple filters
immutableFilters={{
  initiativeId: 'init-123',
  status: ['todo', 'doing', 'blocked'],
  priority: 1
}}
```

## Examples

### Dashboard Section

```tsx
// Used in dashboard-sections/assigned-tasks-section-client.tsx
<TaskList
  tasks={tasks}
  title='Assigned Tasks'
  variant='compact'
  viewAllHref='/my-tasks'
  viewAllLabel='My Tasks'
  emptyStateText='No active tasks assigned to you.'
  onTaskUpdate={() => window.location.reload()}
/>
```

### Initiative Detail Page

```tsx
// Used in initiatives/initiative-tasks.tsx
<TaskList
  tasks={tasks}
  title='Tasks'
  variant='full'
  showAddButton={true}
  initiativeId={initiativeId}
  emptyStateText='No tasks found for this initiative.'
  onTaskUpdate={handleTaskUpdate}
  immutableFilters={{ initiativeId }}
/>
```

### Dashboard Section with Multiple Filters

```tsx
// Used in dashboard-sections/assigned-tasks-section-client.tsx
<TaskList
  tasks={tasks}
  title='Assigned Tasks'
  variant='compact'
  viewAllHref='/my-tasks'
  viewAllLabel='My Tasks'
  emptyStateText='No active tasks assigned to you.'
  onTaskUpdate={handleTaskUpdate}
  immutableFilters={{
    assigneeId: personId,
    status: ['todo', 'doing', 'blocked'],
  }}
/>
```

### Custom Implementation

```tsx
// Custom usage with different configuration
<TaskList
  tasks={tasks}
  title='High Priority Tasks'
  variant='compact'
  emptyStateText='No high priority tasks at this time.'
  onTaskUpdate={refetchTasks}
  className='border-2 border-red-200'
  immutableFilters={{ priority: 1 }}
/>
```

## Migration Guide

### From Dashboard Assigned Tasks Section

Replace the complex dashboard implementation with:

```tsx
// Before
export function DashboardAssignedTasksClientSection({ tasks }) {
  // ... complex implementation with state management
}

// After
export function DashboardAssignedTasksClientSection({ tasks }) {
  return (
    <TaskList
      tasks={tasks}
      title='Assigned Tasks'
      variant='compact'
      viewAllHref='/my-tasks'
      viewAllLabel='My Tasks'
      emptyStateText='No active tasks assigned to you.'
      onTaskUpdate={() => window.location.reload()}
    />
  )
}
```

### From Initiative Tasks Section

Replace the TaskDataTable with TaskList for a more integrated experience:

```tsx
// Before
<TaskDataTable immutableFilters={{ initiativeId }} hideFilters={true} />

// After
<TaskList
  tasks={tasks}
  title="Tasks"
  variant="full"
  showAddButton={true}
  initiativeId={initiativeId}
  onTaskUpdate={handleTaskUpdate}
/>
```

## Best Practices

1. **Use appropriate variant**: `compact` for dashboards, `full` for detail pages
2. **Provide meaningful empty state text**: Customize the message for context
3. **Handle task updates**: Always provide an `onTaskUpdate` callback
4. **Use viewAllHref**: Provide navigation to full task list when appropriate
5. **Show add button**: Enable task creation when users should be able to add tasks
6. **Consistent styling**: Use the same TaskList component across the app for consistency
