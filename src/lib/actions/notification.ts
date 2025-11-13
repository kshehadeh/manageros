'use server'

import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { InputJsonValue } from '@prisma/client/runtime/library'

export interface CreateNotificationData {
  title: string
  message: string
  type?: 'info' | 'warning' | 'success' | 'error'
  organizationId?: string
  userId?: string
  metadata?: Record<string, unknown>
}

export interface NotificationWithResponse {
  id: string
  title: string
  message: string
  type: string
  createdAt: Date
  userId?: string | null
  targetUser?: {
    id: string
    name: string
    email: string
  } | null
  response?: {
    id: string
    status: string
    readAt: Date | null
    dismissedAt: Date | null
  }
}

/**
 * Create a notification directly without authentication
 * This is for system-level operations like cron jobs
 * Requires organizationId and optionally userId
 */
export async function createSystemNotification(
  data: Required<
    Pick<CreateNotificationData, 'title' | 'message' | 'organizationId'>
  > &
    Pick<CreateNotificationData, 'type' | 'userId' | 'metadata'>
) {
  if (!data.organizationId) {
    throw new Error('Organization ID is required for system notifications')
  }

  const notification = await prisma.notification.create({
    data: {
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      organizationId: data.organizationId,
      userId: data.userId || null,
      metadata: (data.metadata as InputJsonValue) || undefined,
    },
  })

  return notification
}

/**
 * Create a new notification
 * If userId is provided, it's a user-specific notification
 * If only organizationId is provided, it's an organization-wide notification
 */
export async function createNotification(data: CreateNotificationData) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error(
      'User must belong to an organization to create notifications'
    )
  }

  // If userId is provided, ensure the user belongs to the same organization
  if (
    data.userId &&
    data.organizationId &&
    data.organizationId !== user.organizationId
  ) {
    throw new Error(
      'Cannot create notification for user in different organization'
    )
  }

  // If only organizationId is provided, ensure it matches the current user's organization
  if (
    !data.userId &&
    data.organizationId &&
    data.organizationId !== user.organizationId
  ) {
    throw new Error('Cannot create notification for different organization')
  }

  const notification = await prisma.notification.create({
    data: {
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      organizationId: data.organizationId || user.organizationId,
      userId: data.userId || null,
      metadata: (data.metadata as InputJsonValue) || undefined,
    },
  })

  revalidatePath('/')
  return notification
}

/**
 * Get notifications for the current user
 * Returns both user-specific and organization-wide notifications
 */
export async function getUserNotifications(limit: number = 10) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view notifications')
  }

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        // User-specific notifications
        { userId: user.id },
        // Organization-wide notifications
        {
          organizationId: user.organizationId,
          userId: null,
        },
      ],
    },
    include: {
      responses: {
        where: {
          userId: user.id,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })

  return notifications.map(notification => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    createdAt: notification.createdAt,
    userId: notification.userId,
    targetUser: notification.user
      ? {
          id: notification.user.id,
          name: notification.user.name,
          email: notification.user.email,
        }
      : null,
    response: notification.responses[0] || null,
  }))
}

/**
 * Get unread notifications for the current user
 */
export async function getUnreadNotifications(limit: number = 5) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view notifications')
  }

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        // User-specific notifications
        { userId: user.id },
        // Organization-wide notifications
        {
          organizationId: user.organizationId,
          userId: null,
        },
      ],
      // Only include notifications that don't have a response or have unread status
      responses: {
        none: {
          userId: user.id,
          status: { in: ['read', 'dismissed'] },
        },
      },
    },
    include: {
      responses: {
        where: {
          userId: user.id,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })

  return notifications.map(notification => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    createdAt: notification.createdAt,
    response: notification.responses[0] || null,
  }))
}

/**
 * Mark a notification as read
 * Creates a response record if it doesn't exist
 */
export async function markNotificationAsRead(notificationId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  // Verify the notification exists and user has access to it
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      OR: [
        { userId: user.id },
        {
          organizationId: user.organizationId,
          userId: null,
        },
      ],
    },
  })

  if (!notification) {
    throw new Error('Notification not found or access denied')
  }

  // Upsert the response record
  const response = await prisma.notificationResponse.upsert({
    where: {
      // eslint-disable-next-line camelcase
      notificationId_userId: {
        notificationId,
        userId: user.id,
      },
    },
    update: {
      status: 'read',
      readAt: new Date(),
    },
    create: {
      notificationId,
      userId: user.id,
      status: 'read',
      readAt: new Date(),
    },
  })

  revalidatePath('/')
  return response
}

/**
 * Mark a notification as dismissed
 * Creates a response record if it doesn't exist
 */
export async function markNotificationAsDismissed(notificationId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  // Verify the notification exists and user has access to it
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      OR: [
        { userId: user.id },
        {
          organizationId: user.organizationId,
          userId: null,
        },
      ],
    },
  })

  if (!notification) {
    throw new Error('Notification not found or access denied')
  }

  // Upsert the response record
  const response = await prisma.notificationResponse.upsert({
    where: {
      // eslint-disable-next-line camelcase
      notificationId_userId: {
        notificationId,
        userId: user.id,
      },
    },
    update: {
      status: 'dismissed',
      dismissedAt: new Date(),
    },
    create: {
      notificationId,
      userId: user.id,
      status: 'dismissed',
      dismissedAt: new Date(),
    },
  })

  revalidatePath('/')
  return response
}

/**
 * Get the count of unread notifications for the current user
 */
export async function getUnreadNotificationCount() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!user.organizationId) {
    return 0
  }

  const count = await prisma.notification.count({
    where: {
      OR: [
        // User-specific notifications
        { userId: user.id },
        // Organization-wide notifications
        {
          organizationId: user.organizationId,
          userId: null,
        },
      ],
      // Only count notifications that don't have a response or have unread status
      responses: {
        none: {
          userId: user.id,
          status: { in: ['read', 'dismissed'] },
        },
      },
    },
  })

  return count
}

/**
 * Delete a notification (admin only)
 */
export async function deleteNotification(notificationId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!user.organizationId) {
    throw new Error(
      'User must belong to an organization to delete notifications'
    )
  }

  // Only admins or owners can delete notifications
  if (!isAdminOrOwner(user)) {
    throw new Error('Only administrators or owners can delete notifications')
  }

  // Verify the notification exists and belongs to the user's organization
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      organizationId: user.organizationId,
    },
  })

  if (!notification) {
    throw new Error('Notification not found or access denied')
  }

  // Delete the notification (this will cascade delete related responses)
  await prisma.notification.delete({
    where: { id: notificationId },
  })

  revalidatePath('/notifications')
  revalidatePath('/')
}

/**
 * Get all notifications for the current user (for the full notifications page)
 */
export async function getAllUserNotifications(
  page: number = 1,
  limit: number = 20,
  showAllOrganizationNotifications: boolean = false
) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!user.organizationId) {
    throw new Error('User must belong to an organization to view notifications')
  }

  const skip = (page - 1) * limit

  const whereClause =
    showAllOrganizationNotifications && user.role === 'ADMIN'
      ? {
          // Admin view: all notifications in the organization
          organizationId: user.organizationId,
        }
      : {
          // Regular user view: only their notifications and organization-wide ones
          OR: [
            // User-specific notifications
            { userId: user.id },
            // Organization-wide notifications
            {
              organizationId: user.organizationId,
              userId: null,
            },
          ],
        }

  const [notifications, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      include: {
        responses: {
          where: {
            userId: user.id,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: whereClause,
    }),
  ])

  return {
    notifications: notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
      userId: notification.userId,
      targetUser: notification.user
        ? {
            id: notification.user.id,
            name: notification.user.name,
            email: notification.user.email,
          }
        : notification.userId === null
          ? { id: 'organization', name: 'Organization', email: '' }
          : null,
      response: notification.responses[0] || null,
    })),
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  }
}
