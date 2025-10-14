# Notifications API

## Overview

The Notifications API provides functionality for creating, managing, and responding to notifications within an organization. Notifications can be user-specific or organization-wide, and users can mark them as read or dismissed.

## Security

- All notification operations require authentication
- Users can only view notifications for their organization
- Organization-wide notifications (no userId) are visible to all organization members
- User-specific notifications are only visible to the target user
- Only admins can delete notifications
- See the [Security Requirements](../../.cursor/rules/security-requirements.mdc) for detailed access control rules

## REST Endpoints

### GET /api/notifications

Retrieves notifications for the current user.

**Authentication:** Required

**Query Parameters:**

| Parameter     | Type    | Required | Description                                         |
| ------------- | ------- | -------- | --------------------------------------------------- |
| `limit`       | number  | No       | Max number of notifications to return (default: 10) |
| `page`        | number  | No       | Page number for pagination (default: 1)             |
| `includeRead` | boolean | No       | Include read notifications (default: true)          |

**Response:**

```json
{
  "notifications": [
    {
      "id": "notif_123",
      "title": "New task assigned",
      "message": "You have been assigned to 'Implement feature X'",
      "type": "info",
      "createdAt": "2025-10-14T12:00:00.000Z",
      "userId": "user_456",
      "targetUser": {
        "id": "user_456",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "response": {
        "id": "resp_789",
        "status": "read",
        "readAt": "2025-10-14T13:00:00.000Z",
        "dismissedAt": null
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

### GET /api/notifications/count

Gets the count of unread notifications for the current user.

**Authentication:** Required

**Response:**

```json
{
  "count": 5
}
```

### GET /api/notifications/live

Streaming endpoint for real-time notifications (Server-Sent Events).

**Authentication:** Required

**Note:** This endpoint keeps the connection open and sends new notifications as they arrive.

## Server Actions

### createNotification

Creates a new notification (requires authentication).

**Function Signature:**

```typescript
createNotification(data: CreateNotificationData): Promise<Notification>
```

**Parameters:**

```typescript
interface CreateNotificationData {
  title: string
  message: string
  type?: 'info' | 'warning' | 'success' | 'error' // Default: 'info'
  organizationId?: string // Defaults to current user's organization
  userId?: string // Optional: specific user, otherwise organization-wide
  metadata?: Record<string, unknown> // Optional additional data
}
```

**Returns:** Created notification object

**Throws:**

- `Error: "Authentication required"`
- `Error: "User must belong to an organization to create notifications"`
- `Error: "Cannot create notification for user in different organization"`
- `Error: "Cannot create notification for different organization"`

**Example:**

```typescript
import { createNotification } from '@/lib/actions/notification'

// User-specific notification
await createNotification({
  title: 'Task Assigned',
  message: 'You have been assigned to the Q4 planning task',
  type: 'info',
  userId: 'user_123',
  metadata: {
    taskId: 'task_456',
    taskTitle: 'Q4 Planning',
  },
})

// Organization-wide notification
await createNotification({
  title: 'System Maintenance',
  message: 'Scheduled maintenance tonight at 11 PM',
  type: 'warning',
})
```

---

### createSystemNotification

Creates a notification without authentication (for system/cron jobs).

**Function Signature:**

```typescript
createSystemNotification(
  data: Required<Pick<CreateNotificationData, 'title' | 'message' | 'organizationId'>> &
        Pick<CreateNotificationData, 'type' | 'userId' | 'metadata'>
): Promise<Notification>
```

**Parameters:**

- Same as `createNotification` but `organizationId` is required

**Throws:**

- `Error: "Organization ID is required for system notifications"`

**Example:**

```typescript
// Called from cron job
await createSystemNotification({
  title: 'Weekly Report Ready',
  message: 'Your weekly team report is now available',
  organizationId: 'org_123',
  userId: 'user_456',
  type: 'success',
})
```

---

### getUserNotifications

Gets notifications for the current user.

**Function Signature:**

```typescript
getUserNotifications(limit?: number): Promise<NotificationWithResponse[]>
```

**Parameters:**

- `limit`: Max number of notifications (default: 10)

**Returns:** Array of notifications with response status

```typescript
interface NotificationWithResponse {
  id: string
  title: string
  message: string
  type: string
  createdAt: Date
  userId: string | null
  targetUser: {
    id: string
    name: string
    email: string
  } | null
  response: {
    id: string
    status: string
    readAt: Date | null
    dismissedAt: Date | null
  } | null
}
```

**Throws:**

- `Error: "Authentication required"`
- `Error: "User must belong to an organization to view notifications"`

**Access Control:**

Returns notifications that are:

- User-specific (userId matches current user), OR
- Organization-wide (userId is null)

---

### getUnreadNotifications

Gets unread notifications for the current user.

**Function Signature:**

```typescript
getUnreadNotifications(limit?: number): Promise<Notification[]>
```

**Parameters:**

- `limit`: Max number of notifications (default: 5)

**Returns:** Array of unread notifications

**Throws:**

- `Error: "Authentication required"`
- `Error: "User must belong to an organization to view notifications"`

**Access Control:**

Returns notifications without responses or with status not in ['read', 'dismissed'].

---

### getAllUserNotifications

Gets all notifications with pagination (for notifications page).

**Function Signature:**

```typescript
getAllUserNotifications(
  page?: number,
  limit?: number,
  showAllOrganizationNotifications?: boolean
): Promise<{
  notifications: NotificationWithResponse[]
  totalCount: number
  totalPages: number
  currentPage: number
}>
```

**Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `showAllOrganizationNotifications`: Admin only - show all org notifications (default: false)

**Returns:** Paginated notifications

**Throws:**

- `Error: "Authentication required"`
- `Error: "User must belong to an organization to view notifications"`

**Admin View:**

If `showAllOrganizationNotifications` is true and user is admin, returns all notifications in the organization.

---

### markNotificationAsRead

Marks a notification as read.

**Function Signature:**

```typescript
markNotificationAsRead(notificationId: string): Promise<NotificationResponse>
```

**Parameters:**

- `notificationId`: Notification ID to mark as read

**Returns:** Notification response object

**Throws:**

- `Error: "Authentication required"`
- `Error: "Notification not found or access denied"`

**Behavior:**

- Creates or updates a response record
- Sets status to 'read'
- Records readAt timestamp

**Example:**

```typescript
await markNotificationAsRead('notif_123')
```

---

### markNotificationAsDismissed

Marks a notification as dismissed.

**Function Signature:**

```typescript
markNotificationAsDismissed(notificationId: string): Promise<NotificationResponse>
```

**Parameters:**

- `notificationId`: Notification ID to dismiss

**Returns:** Notification response object

**Throws:**

- `Error: "Authentication required"`
- `Error: "Notification not found or access denied"`

**Behavior:**

- Creates or updates a response record
- Sets status to 'dismissed'
- Records dismissedAt timestamp

**Example:**

```typescript
await markNotificationAsDismissed('notif_123')
```

---

### getUnreadNotificationCount

Gets the count of unread notifications.

**Function Signature:**

```typescript
getUnreadNotificationCount(): Promise<number>
```

**Returns:** Number of unread notifications

**Throws:**

- `Error: "Authentication required"`

**Example:**

```typescript
const count = await getUnreadNotificationCount()
// Display badge: count > 0 ? count : ''
```

---

### deleteNotification

Deletes a notification (admin only).

**Function Signature:**

```typescript
deleteNotification(notificationId: string): Promise<void>
```

**Parameters:**

- `notificationId`: Notification ID to delete

**Returns:** `void`

**Throws:**

- `Error: "Authentication required"`
- `Error: "User must belong to an organization to delete notifications"`
- `Error: "Only administrators can delete notifications"`
- `Error: "Notification not found or access denied"`

**Behavior:**

Cascade deletes related responses.

## Notification Types

- `info` - Informational messages (default)
- `warning` - Warning or caution messages
- `success` - Success or confirmation messages
- `error` - Error or critical messages

## Response Status Values

- `unread` - Not yet read (default, no response record)
- `read` - User has read the notification
- `dismissed` - User has dismissed the notification

## Notification Visibility

### User-Specific Notifications

```typescript
await createNotification({
  title: 'Task Assigned',
  message: 'New task assigned to you',
  userId: 'user_123', // Only visible to this user
})
```

### Organization-Wide Notifications

```typescript
await createNotification({
  title: 'Company Announcement',
  message: 'All-hands meeting tomorrow',
  // No userId - visible to all org members
})
```

## Data Model

### Notification

```typescript
interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  createdAt: Date
  updatedAt: Date
  organizationId: string
  userId: string | null // null = organization-wide
  metadata: any | null

  // Relations
  organization: Organization
  user: User | null
  responses: NotificationResponse[]
}
```

### NotificationResponse

```typescript
interface NotificationResponse {
  id: string
  notificationId: string
  userId: string
  status: string
  readAt: Date | null
  dismissedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
```

## Use Cases

### 1. Task Assignment Notification

```typescript
await createNotification({
  title: 'New Task Assigned',
  message: `You have been assigned to "${taskTitle}"`,
  type: 'info',
  userId: assigneeUserId,
  metadata: {
    taskId: task.id,
    taskTitle: task.title,
    assignedBy: currentUser.id,
  },
})
```

### 2. Deadline Reminder (System)

```typescript
// From cron job
await createSystemNotification({
  title: 'Upcoming Deadline',
  message: `Task "${task.title}" is due tomorrow`,
  type: 'warning',
  organizationId: task.organizationId,
  userId: task.assigneeId,
  metadata: {
    taskId: task.id,
    dueDate: task.dueDate,
  },
})
```

### 3. Organization Announcement

```typescript
await createNotification({
  title: 'System Maintenance',
  message: 'Platform will be down for maintenance tonight 11 PM - 2 AM',
  type: 'warning',
  // No userId - all org members see this
})
```

### 4. Success Confirmation

```typescript
await createNotification({
  title: 'Report Generated',
  message: 'Your Q4 performance report is ready',
  type: 'success',
  userId: requestingUserId,
  metadata: {
    reportId: report.id,
    reportType: 'performance',
  },
})
```

## Real-Time Notifications

### Server-Sent Events Endpoint

```typescript
// Client-side code
const eventSource = new EventSource('/api/notifications/live')

eventSource.onmessage = event => {
  const notification = JSON.parse(event.data)
  // Display notification in UI
  showNotification(notification)
}

eventSource.onerror = error => {
  console.error('Notification stream error:', error)
  eventSource.close()
}
```

## Access Control

### View Permissions

Users can view notifications if:

- ✅ It's a user-specific notification (userId matches)
- ✅ It's an organization-wide notification (userId is null)
- ❌ Cannot view other users' specific notifications

### Management Permissions

- ✅ All users can mark their notifications as read/dismissed
- ✅ Only admins can delete notifications
- ✅ System (cron jobs) can create notifications without authentication

## Best Practices

### 1. Use Appropriate Types

```typescript
// Info for general notifications
await createNotification({
  title: 'New Comment',
  message: 'Someone commented on your task',
  type: 'info',
})

// Warning for important notices
await createNotification({
  title: 'Action Required',
  message: 'Please review the updated policy',
  type: 'warning',
})

// Success for confirmations
await createNotification({
  title: 'Changes Saved',
  message: 'Your profile has been updated',
  type: 'success',
})

// Error for critical issues
await createNotification({
  title: 'Sync Failed',
  message: 'Failed to sync with external service',
  type: 'error',
})
```

### 2. Include Useful Metadata

```typescript
await createNotification({
  title: 'Meeting Reminder',
  message: 'Team standup in 15 minutes',
  type: 'info',
  userId: user.id,
  metadata: {
    meetingId: 'meeting_123',
    meetingTitle: 'Daily Standup',
    scheduledAt: meeting.scheduledAt,
    location: meeting.location,
    // Can be used to create deep links
    deepLink: `/meetings/${meeting.id}`,
  },
})
```

### 3. Clean Up Old Notifications

```typescript
// Admin maintenance task
const oldNotifications = await prisma.notification.findMany({
  where: {
    createdAt: {
      lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    },
    responses: {
      every: {
        status: { in: ['read', 'dismissed'] },
      },
    },
  },
})

for (const notif of oldNotifications) {
  await deleteNotification(notif.id)
}
```

### 4. Batch Notifications

```typescript
// When multiple users need the same notification
const teamMembers = await getTeamMembers('team_123')

for (const member of teamMembers) {
  if (member.userId) {
    await createNotification({
      title: 'Team Update',
      message: 'New sprint has started',
      type: 'info',
      userId: member.userId,
    })
  }
}
```

## Related APIs

- [Organizations API](./organizations.md) - For organization management
- [Tasks API](./tasks.md) - Task-related notifications
- [Meetings API](./meetings.md) - Meeting reminders

## Cron Job Integration

For scheduled notifications, use `createSystemNotification`:

```typescript
// In cron job handler
export async function sendDailyDigests() {
  const users = await getAllActiveUsers()

  for (const user of users) {
    const tasks = await getTasksDueToday(user.id)

    if (tasks.length > 0) {
      await createSystemNotification({
        title: 'Daily Digest',
        message: `You have ${tasks.length} task(s) due today`,
        type: 'info',
        organizationId: user.organizationId,
        userId: user.id,
        metadata: {
          taskCount: tasks.length,
          taskIds: tasks.map(t => t.id),
        },
      })
    }
  }
}
```
