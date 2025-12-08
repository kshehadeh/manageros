/**
 * Activity monitoring job - finds users with no recent activity
 */

import {
  CronJob,
  CronJobResult,
  CronJobExecutionContext,
  NotificationData,
} from '../types'
import { prisma } from '@/lib/db'
import { createSystemNotification } from '../../actions/notification'
import type { Prisma } from '@/generated/prisma'

type InputJsonValue = Prisma.InputJsonValue

export class ActivityMonitoringJob extends CronJob {
  readonly id = 'activity-monitoring'
  readonly name = 'Activity Monitoring'
  readonly description =
    'Notifies managers about team members with no recent tasks, Jira tickets, or pull requests'
  readonly schedule = '0 10 * * 1' // Weekly on Monday at 10 AM

  async execute(context: CronJobExecutionContext): Promise<CronJobResult> {
    const { organizationId } = context
    let notificationsCreated = 0
    const metadata: Record<string, InputJsonValue> = {}

    try {
      if (!organizationId) {
        throw new Error('Organization ID is required')
      }

      const config = context.config.config || this.getDefaultConfig()
      const daysBack = config.daysBack || 14

      // Get all people who are managers (have reports) with linked user accounts
      const managersWithReports = await prisma.person.findMany({
        where: {
          organizationId,
          status: 'active',
          reports: {
            some: {},
          },
          user: {
            isNot: null,
          },
        },
        include: {
          user: true,
          reports: {
            where: {
              status: 'active',
            },
            include: {
              jiraAccount: true,
              githubAccount: true,
            },
          },
        },
      })

      metadata.managersProcessed = managersWithReports.length

      for (const manager of managersWithReports) {
        if (!manager.user) continue

        const inactiveReports = await this.findInactiveReports(
          manager.reports,
          daysBack as number
        )

        if (inactiveReports.length > 0) {
          // Create deduplication key based on the inactive reports
          const deduplicationKey =
            this.createActivityDeduplicationKey(inactiveReports)

          // Check if we should send this notification (deduplication)
          const shouldSend = await this.shouldSendNotification(
            manager.user.id,
            organizationId,
            deduplicationKey,
            168 // Don't send duplicate activity notifications within 7 days (168 hours)
          )

          if (shouldSend) {
            const notificationData = this.createActivityNotification(
              manager.user.id,
              organizationId,
              inactiveReports,
              daysBack as number,
              deduplicationKey
            )

            await createSystemNotification(notificationData)
            notificationsCreated++
          }
        }
      }

      metadata.inactiveReportsFound = notificationsCreated

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

  validateConfig(config: Record<string, unknown>): boolean {
    const daysBack = config.daysBack
    return typeof daysBack === 'number' && daysBack > 0 && daysBack <= 90
  }

  getDefaultConfig(): Record<string, unknown> {
    return {
      daysBack: 14, // Check for activity in the last 14 days
    }
  }

  /**
   * Find reports with no recent activity
   */
  private async findInactiveReports(
    reports: Array<{
      id: string
      name: string
      jiraAccount: { jiraAccountId: string } | null
      githubAccount: { githubUsername: string } | null
    }>,
    daysBack: number
  ): Promise<
    Array<{ name: string; lastActivity?: Date; activityType?: string }>
  > {
    const inactiveReports: Array<{
      name: string
      lastActivity?: Date
      activityType?: string
    }> = []
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysBack)

    for (const report of reports) {
      const hasRecentActivity = await this.checkRecentActivity(
        report.id,
        cutoffDate
      )

      if (!hasRecentActivity.found) {
        inactiveReports.push({
          name: report.name,
          lastActivity: hasRecentActivity.lastActivity,
          activityType: hasRecentActivity.activityType,
        })
      }
    }

    return inactiveReports
  }

  /**
   * Check if a person has recent activity
   */
  private async checkRecentActivity(
    personId: string,
    cutoffDate: Date
  ): Promise<{ found: boolean; lastActivity?: Date; activityType?: string }> {
    // Check for recent tasks
    const recentTask = await prisma.task.findFirst({
      where: {
        assigneeId: personId,
        assignee: {
          status: 'active',
        },
        OR: [
          { updatedAt: { gte: cutoffDate } },
          { createdAt: { gte: cutoffDate } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (recentTask) {
      return {
        found: true,
        lastActivity: recentTask.updatedAt,
        activityType: 'task',
      }
    }

    // Note: Jira ticket tracking would require a JiraAssignedTicket model
    // This feature can be added when the model is available

    // Note: GitHub activity tracking would require fetching from GitHub API
    // This feature can be added when needed

    // Check for recent one-on-one meetings
    const recentOneOnOne = await prisma.oneOnOne.findFirst({
      where: {
        reportId: personId,
        report: {
          status: 'active',
        },
        scheduledAt: { gte: cutoffDate },
      },
      orderBy: { scheduledAt: 'desc' },
    })

    if (recentOneOnOne) {
      return {
        found: true,
        lastActivity: recentOneOnOne.scheduledAt || undefined,
        activityType: 'one-on-one',
      }
    }

    // Check for recent feedback
    const recentFeedback = await prisma.feedback.findFirst({
      where: {
        aboutId: personId,
        about: {
          status: 'active',
        },
        createdAt: { gte: cutoffDate },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (recentFeedback) {
      return {
        found: true,
        lastActivity: recentFeedback.createdAt,
        activityType: 'feedback',
      }
    }

    return { found: false }
  }

  /**
   * Create deduplication key for activity notifications
   * Key is based on the specific inactive reports
   */
  private createActivityDeduplicationKey(
    inactiveReports: Array<{
      name: string
      lastActivity?: Date
      activityType?: string
    }>
  ): string {
    // Sort by name to ensure consistent key generation
    const sortedReports = [...inactiveReports].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    const keyData = sortedReports.map(r => r.name).join('|')
    return `activity:${keyData}`
  }

  /**
   * Create notification data for inactive reports
   */
  private createActivityNotification(
    userId: string,
    organizationId: string,
    inactiveReports: Array<{
      name: string
      lastActivity?: Date
      activityType?: string
    }>,
    daysBack: number,
    deduplicationKey: string
  ): NotificationData {
    const names = inactiveReports.map(r => r.name).join(', ')

    let title: string
    let message: string

    if (inactiveReports.length === 1) {
      const report = inactiveReports[0]
      title = 'Team Member Activity Check'
      message = `${report.name} hasn't had any recent activity in the last ${daysBack} days. Consider checking in with them.`
    } else {
      title = 'Team Activity Check'
      message = `${inactiveReports.length} team members haven't had recent activity in the last ${daysBack} days: ${names}. Consider checking in with them.`
    }

    return this.createNotificationWithDeduplication(
      {
        title,
        message,
        type: 'warning',
        userId,
        organizationId,
        metadata: {
          daysBack,
          inactiveReports: inactiveReports.map(r => ({
            name: r.name,
            lastActivity: r.lastActivity?.toISOString(),
            activityType: r.activityType,
          })),
        },
      },
      deduplicationKey
    )
  }
}
