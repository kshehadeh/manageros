import 'server-only'

import { prisma } from '@/lib/db'
import { getTaskAccessWhereClause } from '@/lib/task-access-utils'
import { TaskReminderDeliveryStatus } from '@/generated/prisma'

export interface TaskReminderUserContext {
  userId: string
  organizationId: string
  personId?: string
}

export class TaskReminderValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TaskReminderValidationError'
  }
}

/**
 * Upsert the current user's reminder preference for a task.
 * Use null for reminderMinutesBeforeDue to clear the reminder.
 */
export async function upsertTaskReminderPreference(
  taskId: string,
  context: TaskReminderUserContext,
  reminderMinutesBeforeDue: number | null
) {
  if (reminderMinutesBeforeDue !== null && reminderMinutesBeforeDue <= 0) {
    throw new Error('Reminder minutes must be positive or null')
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        context.organizationId,
        context.userId,
        context.personId
      ),
    },
  })
  if (!task) {
    throw new Error('Task not found or access denied')
  }

  if (reminderMinutesBeforeDue === null) {
    await prisma.taskReminderPreference.deleteMany({
      where: { taskId, userId: context.userId },
    })
    return
  }

  await prisma.taskReminderPreference.upsert({
    where: {
      taskId_userId: { taskId, userId: context.userId },
    },
    create: {
      taskId,
      userId: context.userId,
      reminderMinutesBeforeDue,
    },
    update: { reminderMinutesBeforeDue },
  })
}

/**
 * Get the current user's reminder preference for a task.
 */
export async function getTaskReminderPreference(
  taskId: string,
  context: TaskReminderUserContext
): Promise<number | null> {
  const pref = await prisma.taskReminderPreference.findUnique({
    where: { taskId_userId: { taskId, userId: context.userId } },
  })
  return pref?.reminderMinutesBeforeDue ?? null
}

/**
 * Ensure delivery records exist for tasks the user can access that have a due date and reminder preference.
 * Invalidates PENDING deliveries for (taskId, userId) when the task's due date has changed.
 * Creates one PENDING delivery per (taskId, userId, taskDueDate) with remindAt = dueDate - reminderMinutes (capped to now if in the past).
 */
export async function ensureDeliveryRecordsForUpcoming(
  context: TaskReminderUserContext,
  windowMs: number = 24 * 60 * 60 * 1000
) {
  const now = new Date()
  const windowEnd = new Date(now.getTime() + windowMs)

  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { not: null, lte: windowEnd },
      status: { notIn: ['done', 'dropped'] },
      completedAt: null,
      ...getTaskAccessWhereClause(
        context.organizationId,
        context.userId,
        context.personId
      ),
      reminderPreferences: {
        some: {
          userId: context.userId,
          reminderMinutesBeforeDue: { not: null },
        },
      },
    },
    include: {
      reminderPreferences: {
        where: { userId: context.userId },
        take: 1,
      },
    },
  })

  for (const task of tasks) {
    const dueDate = task.dueDate!
    const pref = task.reminderPreferences[0]
    const minutes = pref?.reminderMinutesBeforeDue
    if (minutes == null) continue

    const remindAt = new Date(dueDate.getTime() - minutes * 60 * 1000)
    const cappedRemindAt = remindAt < now ? now : remindAt

    const existing = await prisma.taskReminderDelivery.findFirst({
      where: {
        taskId: task.id,
        userId: context.userId,
        taskDueDate: dueDate,
        status: TaskReminderDeliveryStatus.PENDING,
      },
    })
    if (existing) continue

    await prisma.taskReminderDelivery.deleteMany({
      where: {
        taskId: task.id,
        userId: context.userId,
        taskDueDate: { not: dueDate },
        status: TaskReminderDeliveryStatus.PENDING,
      },
    })

    await prisma.taskReminderDelivery.create({
      data: {
        taskId: task.id,
        userId: context.userId,
        taskDueDate: dueDate,
        remindAt: cappedRemindAt,
        status: TaskReminderDeliveryStatus.PENDING,
      },
    })
  }
}

/**
 * Get deliveries that are due now (remindAt <= now, status PENDING) for the user.
 * Only returns deliveries for non-completed tasks.
 * Excludes deliveries already sent via Web Push (pushSentAt set) so in-app does not duplicate.
 */
export async function getDueNowDeliveries(context: TaskReminderUserContext) {
  const now = new Date()
  return prisma.taskReminderDelivery.findMany({
    where: {
      userId: context.userId,
      status: TaskReminderDeliveryStatus.PENDING,
      remindAt: { lte: now },
      pushSentAt: null,
      task: {
        status: { notIn: ['done', 'dropped'] },
        completedAt: null,
      },
    },
    include: {
      task: {
        select: { id: true, title: true, dueDate: true },
      },
    },
    orderBy: { remindAt: 'asc' },
  })
}

/**
 * Ensure delivery records exist for all users in an organization who have tasks with due date and reminder preference.
 * Used by the Web Push cron so reminders can be sent even if the user hasn't opened the app recently.
 */
export async function ensureDeliveryRecordsForOrganization(
  organizationId: string,
  windowMs: number = 24 * 60 * 60 * 1000
) {
  const now = new Date()
  const windowEnd = new Date(now.getTime() + windowMs)
  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { not: null, lte: windowEnd },
      status: { notIn: ['done', 'dropped'] },
      completedAt: null,
      OR: [
        { initiative: { organizationId } },
        { objective: { initiative: { organizationId } } },
        {
          createdBy: {
            organizationMemberships: {
              some: { organizationId },
            },
          },
          initiativeId: null,
          objectiveId: null,
        },
      ],
      reminderPreferences: {
        some: { reminderMinutesBeforeDue: { not: null } },
      },
    },
    include: {
      reminderPreferences: {
        where: { reminderMinutesBeforeDue: { not: null } },
      },
    },
  })

  for (const task of tasks) {
    const dueDate = task.dueDate!
    for (const pref of task.reminderPreferences) {
      const minutes = pref.reminderMinutesBeforeDue
      if (minutes == null) continue
      const remindAt = new Date(dueDate.getTime() - minutes * 60 * 1000)
      const cappedRemindAt = remindAt < now ? now : remindAt
      const existing = await prisma.taskReminderDelivery.findFirst({
        where: {
          taskId: task.id,
          userId: pref.userId,
          taskDueDate: dueDate,
          status: TaskReminderDeliveryStatus.PENDING,
        },
      })
      if (existing) continue
      await prisma.taskReminderDelivery.create({
        data: {
          taskId: task.id,
          userId: pref.userId,
          taskDueDate: dueDate,
          remindAt: cappedRemindAt,
          status: TaskReminderDeliveryStatus.PENDING,
        },
      })
    }
  }
}

/**
 * Get all due-now deliveries for users in an organization (for Web Push cron).
 * Only returns PENDING deliveries not yet sent via push (pushSentAt null).
 */
export async function getDueNowDeliveriesForOrganization(
  organizationId: string
) {
  const now = new Date()
  return prisma.taskReminderDelivery.findMany({
    where: {
      status: TaskReminderDeliveryStatus.PENDING,
      remindAt: { lte: now },
      pushSentAt: null,
      task: {
        status: { notIn: ['done', 'dropped'] },
        completedAt: null,
      },
      user: {
        organizationMemberships: {
          some: { organizationId },
        },
      },
    },
    include: {
      task: {
        select: { id: true, title: true, dueDate: true },
      },
      user: {
        select: { id: true },
      },
    },
    orderBy: { remindAt: 'asc' },
  })
}

/**
 * Get upcoming deliveries (remindAt in the future, within window) for the user.
 * Calls ensureDeliveryRecordsForUpcoming first to lazily create delivery records.
 */
export async function getUpcomingDeliveries(
  context: TaskReminderUserContext,
  windowMs: number = 24 * 60 * 60 * 1000
) {
  await ensureDeliveryRecordsForUpcoming(context, windowMs)
  const now = new Date()
  const windowEnd = new Date(now.getTime() + windowMs)
  return prisma.taskReminderDelivery.findMany({
    where: {
      userId: context.userId,
      status: TaskReminderDeliveryStatus.PENDING,
      remindAt: { lte: windowEnd },
      task: {
        status: { notIn: ['done', 'dropped'] },
        completedAt: null,
      },
    },
    include: {
      task: {
        select: { id: true, title: true, dueDate: true },
      },
    },
    orderBy: { remindAt: 'asc' },
  })
}

/**
 * Mark a delivery as acknowledged. Validates that the delivery belongs to the user and task is accessible.
 */
export async function acknowledgeDelivery(
  deliveryId: string,
  context: TaskReminderUserContext
) {
  const delivery = await prisma.taskReminderDelivery.findFirst({
    where: {
      id: deliveryId,
      userId: context.userId,
      task: {
        ...getTaskAccessWhereClause(
          context.organizationId,
          context.userId,
          context.personId
        ),
      },
    },
  })
  if (!delivery) {
    throw new Error('Reminder not found or access denied')
  }
  await prisma.taskReminderDelivery.update({
    where: { id: deliveryId },
    data: { status: TaskReminderDeliveryStatus.ACKNOWLEDGED },
  })
}

/**
 * Snooze a delivery: mark original as SNOOZED and create a new PENDING delivery with remindAt = now + snoozeMinutes.
 * snoozeMinutes must be <= (taskDueDate - now) in minutes.
 */
export async function snoozeDelivery(
  deliveryId: string,
  context: TaskReminderUserContext,
  snoozeMinutes: number
) {
  if (snoozeMinutes <= 0) {
    throw new TaskReminderValidationError('Snooze minutes must be positive')
  }

  const delivery = await prisma.taskReminderDelivery.findFirst({
    where: {
      id: deliveryId,
      userId: context.userId,
      status: TaskReminderDeliveryStatus.PENDING,
      task: {
        ...getTaskAccessWhereClause(
          context.organizationId,
          context.userId,
          context.personId
        ),
      },
    },
    include: { task: true },
  })
  if (!delivery) {
    throw new Error('Reminder not found or access denied')
  }

  const now = new Date()
  const minutesUntilDue = Math.floor(
    (delivery.taskDueDate.getTime() - now.getTime()) / (60 * 1000)
  )
  if (minutesUntilDue <= 0) {
    throw new TaskReminderValidationError(
      'Task is already overdue and cannot be snoozed'
    )
  }
  if (snoozeMinutes > minutesUntilDue) {
    throw new TaskReminderValidationError(
      'Snooze time cannot be later than the task due date'
    )
  }

  const newRemindAt = new Date(now.getTime() + snoozeMinutes * 60 * 1000)

  await prisma.$transaction([
    prisma.taskReminderDelivery.update({
      where: { id: deliveryId },
      data: { status: TaskReminderDeliveryStatus.SNOOZED },
    }),
    prisma.taskReminderDelivery.create({
      data: {
        taskId: delivery.taskId,
        userId: context.userId,
        taskDueDate: delivery.taskDueDate,
        remindAt: newRemindAt,
        status: TaskReminderDeliveryStatus.PENDING,
      },
    }),
  ])
}

/**
 * When a task's due date is updated, invalidate PENDING deliveries for all users
 * on that task so stale records are not sent with the old schedule.
 */
export async function invalidateDeliveriesForTaskDueDateChange(
  taskId: string,
  context: TaskReminderUserContext,
  newDueDate: Date | null
) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      ...getTaskAccessWhereClause(
        context.organizationId,
        context.userId,
        context.personId
      ),
    },
    select: { id: true },
  })
  if (!task) {
    throw new Error('Task not found or access denied')
  }

  if (newDueDate === null) {
    await prisma.taskReminderDelivery.deleteMany({
      where: {
        taskId,
        status: TaskReminderDeliveryStatus.PENDING,
      },
    })
    return
  }

  await prisma.taskReminderDelivery.deleteMany({
    where: {
      taskId,
      taskDueDate: { not: newDueDate },
      status: TaskReminderDeliveryStatus.PENDING,
    },
  })
}

/**
 * Mark a delivery as having been sent via Web Push (so in-app poll skips it).
 */
export async function markDeliveryPushSent(deliveryId: string) {
  await prisma.taskReminderDelivery.update({
    where: { id: deliveryId },
    data: { pushSentAt: new Date() },
  })
}
