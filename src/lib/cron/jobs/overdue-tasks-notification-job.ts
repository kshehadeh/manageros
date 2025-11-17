/**
 * Overdue tasks notification job - finds tasks with past due dates and notifies assignees
 */

import {
  CronJob,
  CronJobResult,
  CronJobExecutionContext,
  NotificationData,
} from '../types'
import { prisma } from '@/lib/db'
import { createSystemNotification } from '../../actions/notification'
import { InputJsonValue } from '@prisma/client/runtime/library'

export class OverdueTasksNotificationJob extends CronJob {
  readonly id = 'overdue-tasks-notification'
  readonly name = 'Overdue Tasks Notification'
  readonly description =
    'Notifies users about tasks that have passed their due dates'
  readonly schedule = '0 9 * * *' // Daily at 9 AM

  async execute(context: CronJobExecutionContext): Promise<CronJobResult> {
    const { organizationId } = context
    let notificationsCreated = 0
    const metadata: Record<string, InputJsonValue> = {}

    try {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      const now = new Date()
      // Set time to start of day for accurate date comparison
      now.setHours(0, 0, 0, 0)

      // Find all tasks that are overdue
      // Tasks are overdue if:
      // - dueDate is set and is before today
      // - status is not 'done' or 'dropped'
      // - has an assignee
      // - assignee belongs to the organization
      // - task belongs to organization (via initiative, objective, or createdBy)
      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: {
            lt: now,
          },
          status: {
            notIn: ['done', 'dropped'],
          },
          assigneeId: {
            not: null,
          },
          assignee: {
            organizationId,
            status: 'active',
            user: {
              isNot: null,
            },
          },
          OR: [
            // Task is associated with an initiative in the organization
            {
              initiative: {
                organizationId,
              },
            },
            // Task is associated with an objective that has an initiative in the organization
            {
              objective: {
                initiative: {
                  organizationId,
                },
              },
            },
          ],
        },
        include: {
          assignee: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      })

      metadata.overdueTasksFound = overdueTasks.length

      // Group tasks by assignee user
      const tasksByUser = new Map<
        string,
        Array<{
          id: string
          title: string
          dueDate: Date
        }>
      >()

      for (const task of overdueTasks) {
        if (!task.assignee?.user) continue

        const userId = task.assignee.user.id
        if (!tasksByUser.has(userId)) {
          tasksByUser.set(userId, [])
        }

        tasksByUser.get(userId)?.push({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate!,
        })
      }

      metadata.usersWithOverdueTasks = tasksByUser.size

      // Create notifications for each user
      for (const [userId, tasks] of tasksByUser.entries()) {
        const assignee = overdueTasks.find(
          t => t.assignee?.user?.id === userId
        )?.assignee

        if (!assignee?.user) continue

        // Create deduplication key based on task IDs
        const deduplicationKey = this.createOverdueTasksDeduplicationKey(tasks)

        // Check if we should send this notification (deduplication)
        const shouldSend = await this.shouldSendNotification(
          userId,
          organizationId,
          deduplicationKey,
          24 // Don't send duplicate notifications within 24 hours
        )

        if (shouldSend) {
          const notificationData = this.createOverdueTasksNotification(
            userId,
            organizationId,
            tasks,
            deduplicationKey
          )

          await createSystemNotification(notificationData)
          notificationsCreated++
        }
      }

      return {
        success: true,
        notificationsCreated,
        metadata,
      }
    } catch (error) {
      return {
        success: false,
        notificationsCreated,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata,
      }
    }
  }

  validateConfig(_config: Record<string, unknown>): boolean {
    // This job doesn't require any specific configuration
    return true
  }

  getDefaultConfig(): Record<string, unknown> {
    return {}
  }

  /**
   * Create deduplication key for overdue tasks notifications
   * Key is based on the specific task IDs
   */
  private createOverdueTasksDeduplicationKey(
    tasks: Array<{ id: string; title: string; dueDate: Date }>
  ): string {
    // Sort by ID to ensure consistent key generation
    const sortedTasks = [...tasks].sort((a, b) => a.id.localeCompare(b.id))
    const taskIds = sortedTasks.map(t => t.id).join('|')
    return `overdue-tasks:${taskIds}`
  }

  /**
   * Create notification data for overdue tasks
   */
  private createOverdueTasksNotification(
    userId: string,
    organizationId: string,
    tasks: Array<{ id: string; title: string; dueDate: Date }>,
    deduplicationKey: string
  ): NotificationData {
    let title: string
    let message: string

    if (tasks.length === 1) {
      const task = tasks[0]
      title = 'Overdue Task'
      message = `Task "${task.title}" is overdue`
    } else {
      title = 'Overdue Tasks'
      message = `You have ${tasks.length} overdue task(s)`
    }

    return this.createNotificationWithDeduplication(
      {
        title,
        message,
        type: 'warning',
        userId,
        organizationId,
        metadata: {
          overdueTaskIds: tasks.map(t => t.id),
          taskCount: tasks.length,
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate.toISOString(),
          })),
        },
      },
      deduplicationKey
    )
  }
}
